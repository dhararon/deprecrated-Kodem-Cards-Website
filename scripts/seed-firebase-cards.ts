/**
 * Script para insertar cartas desde fixtures/cards-latest.json en el emulador de Firebase
 * 
 * Ejecutar con: bun run scripts/seed-firebase-cards.ts
 */

import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as dotenv from 'dotenv';
import { existsSync, readFileSync } from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import { AbortController } from 'abort-controller';

// Cargar variables de entorno desde .env
const envPath = path.resolve(process.cwd(), '.env');
if (existsSync(envPath)) {
    console.log(`Cargando variables de entorno desde: ${envPath}`);
    dotenv.config();
} else {
    console.warn('Archivo .env no encontrado, utilizando variables de entorno del sistema');
}

// Obtener el ID del proyecto de Firebase desde las variables de entorno
const projectId = process.env.VITE_FIREBASE_PROJECT_ID || 'kodemcards';
console.log(`Utilizando Project ID: ${projectId}`);

// Comprobar si estamos en entorno Docker
const isDocker = existsSync('/.dockerenv') || process.env.DOCKER_CONTAINER === 'true';
console.log(`Ejecutando en entorno Docker: ${isDocker ? 'Sí' : 'No'}`);

// Configuración de emuladores
// Si estamos en Docker, usamos los nombres de los servicios como hosts, sino localhost
const firestoreEmulatorHost = isDocker ? 'firebase-emulators' : (process.env.FIREBASE_FIRESTORE_EMULATOR_HOST || 'localhost');
const firestoreEmulatorPort = process.env.FIREBASE_FIRESTORE_EMULATOR_PORT || '8080';

// IMPORTANTE: Para el script que se ejecuta FUERA de Docker, siempre usamos localhost
// ya que el script no está dentro de la red de Docker, incluso si los emuladores sí lo están
const firestoreHost = 'localhost';

// URLs para las verificaciones de conexión (siempre usando localhost ya que el script corre fuera de Docker)
const emulatorUIPort = process.env.FIREBASE_EMULATOR_UI_PORT || '4000';
const emulatorUIUrl = `http://localhost:${emulatorUIPort}`;
const firestoreEmulatorUrl = `http://localhost:${firestoreEmulatorPort}`;

console.log(`Configuración de emuladores para verificación:
- Emulator UI: ${emulatorUIUrl}
- Firestore Emulator: ${firestoreEmulatorUrl}`);

// Inicializar Firebase Admin con emuladores (para que Firebase Admin SDK se conecte a los emuladores)
process.env.FIRESTORE_EMULATOR_HOST = `${firestoreHost}:${firestoreEmulatorPort}`;

// Función para verificar si los emuladores están en ejecución
async function checkEmulatorsRunning() {
    try {
        // Verificar que la UI del emulador esté accesible
        console.log(`Verificando UI de emuladores en ${emulatorUIUrl}`);
        try {
            const uiController = new AbortController();
            const uiTimeout = setTimeout(() => uiController.abort(), 3000);
            
            const uiResponse = await fetch(emulatorUIUrl, { 
                method: 'GET',
                signal: uiController.signal
            });
            clearTimeout(uiTimeout);
            
            if (!uiResponse.ok) {
                console.error(`⚠️ UI de emuladores no responde correctamente (status: ${uiResponse.status})`);
                return false;
            }
            console.log('✅ UI de emuladores detectada y funcionando correctamente');
        } catch (error) {
            console.error(`⚠️ No se pudo conectar a la UI de emuladores:`, error);
            return false;
        }
        
        // Verificar que Firestore esté accesible
        console.log(`Verificando Firestore en ${firestoreEmulatorUrl}`);
        try {
            const fsController = new AbortController();
            const fsTimeout = setTimeout(() => fsController.abort(), 3000);
            
            const fsResponse = await fetch(firestoreEmulatorUrl, { 
                method: 'GET',
                signal: fsController.signal
            });
            clearTimeout(fsTimeout);
            
            if (!fsResponse.ok && fsResponse.status !== 404) { // 404 es normal para la raíz
                console.error(`⚠️ Firestore no responde correctamente (status: ${fsResponse.status})`);
                return false;
            }
            console.log('✅ Firestore detectado y funcionando correctamente');
        } catch (error) {
            console.error(`⚠️ No se pudo conectar a Firestore:`, error);
            return false;
        }
        
        return true;
    } catch (error) {
        console.error('❌ Error al verificar emuladores:', error);
        console.error('\n⚠️ PROBLEMAS DE CONEXIÓN DETECTADOS:');
        console.error('1. Asegúrate de que Docker está en ejecución con: docker ps');
        console.error('2. Verifica que los contenedores de Firebase están activos');
        console.error('3. Los puertos deben estar accesibles desde tu máquina local:');
        console.error(`   - UI Emuladores: ${emulatorUIUrl}`);
        console.error(`   - Firestore: ${firestoreEmulatorUrl}`);
        console.error('4. Verifica que firebase.json tenga "host": "0.0.0.0" para todos los emuladores');
        console.error('5. Reconstruye los contenedores si es necesario: docker-compose up --build\n');
        return false;
    }
}

// Leer el archivo fixtures/cards-latest.json
function readCardsFile() {
    try {
        const cardsFilePath = path.resolve(process.cwd(), 'fixtures/cards-latest.json');
        console.log(`Leyendo archivo de cartas desde: ${cardsFilePath}`);
        
        if (!existsSync(cardsFilePath)) {
            console.error(`❌ El archivo de cartas no existe en la ruta: ${cardsFilePath}`);
            return null;
        }
        
        const fileContent = readFileSync(cardsFilePath, 'utf8');
        return JSON.parse(fileContent);
    } catch (error) {
        console.error('❌ Error al leer o parsear el archivo de cartas:', error);
        return null;
    }
}

// Inicializar la aplicación sin credenciales cuando usamos emuladores
let app, db;

// Función principal para insertar las cartas en Firestore
async function seedCards() {
    console.log('🔥 Iniciando inserción de cartas en emulador de Firestore');
    
    // Verificar que los emuladores estén en ejecución
    const emulatorsRunning = await checkEmulatorsRunning();
    if (!emulatorsRunning) {
        console.error('❌ No se pudo conectar con los emuladores. Abortando.');
        process.exit(1);
    }
    
    // Leer el archivo de cartas
    const cardsData = readCardsFile();
    if (!cardsData) {
        console.error('❌ No se pudieron leer los datos de cartas. Abortando.');
        process.exit(1);
    }
    
    try {
        // Inicializar Firebase Admin
        console.log('Inicializando Firebase Admin SDK...');
        app = initializeApp({
            projectId
        }, 'seed-cards-app');
        
        db = getFirestore(app);
        
        console.log('Firebase Admin SDK inicializado correctamente.');
        
        // Obtener la colección de cartas
        const cardsCollection = db.collection('cards');
        
        // Verificar si hay documentos existentes en la colección
        const existingCards = await cardsCollection.get();
        if (!existingCards.empty) {
            console.log(`⚠️ La colección 'cards' ya contiene ${existingCards.size} documentos.`);
            const continueSeeding = true; // Aquí podrías implementar un prompt para preguntar si continuar
            if (!continueSeeding) {
                console.log('❌ Operación cancelada por el usuario.');
                process.exit(0);
            }
        }
        
        // Contar el número total de cartas a insertar
        const cardsCount = Object.keys(cardsData).length;
        console.log(`Insertando ${cardsCount} cartas en la colección 'cards'...`);
        
        // Crear un lote para inserción en batch
        let batch = db.batch();
        let batchCount = 0;
        const BATCH_SIZE = 500; // Ajustar según sea necesario para el rendimiento
        
        // Contador para el progreso
        let processedCount = 0;
        
        // Insertar cada carta en la colección 'cards'
        for (const [cardId, cardData] of Object.entries(cardsData)) {
            // Eliminar la propiedad __collections__ que no es necesaria en Firestore
            // @ts-ignore
            const { __collections__, ...cardDataToSave } = cardData;
            
            // Crear un documento con el mismo ID que en el archivo JSON
            const cardRef = cardsCollection.doc(cardId);
            batch.set(cardRef, cardDataToSave);
            
            // Incrementar contadores
            batchCount++;
            processedCount++;
            
            // Si alcanzamos el tamaño del lote, enviarlo y crear uno nuevo
            if (batchCount >= BATCH_SIZE) {
                await batch.commit();
                console.log(`Progreso: ${processedCount}/${cardsCount} cartas insertadas (${Math.round(processedCount/cardsCount*100)}%)`);
                batch = db.batch();
                batchCount = 0;
            }
        }
        
        // Enviar el último lote si hay elementos pendientes
        if (batchCount > 0) {
            await batch.commit();
            console.log(`Progreso: ${processedCount}/${cardsCount} cartas insertadas (100%)`);
        }
        
        console.log('✅ Todas las cartas han sido insertadas exitosamente');
    } catch (error) {
        console.error('❌ Error al insertar cartas:', error);
        console.error('\nPosibles soluciones:');
        console.error('1. Asegúrate de que los emuladores están en ejecución: bun run emulators');
        console.error('2. Verifica que el proyecto ID es correcto: ' + projectId);
        console.error('3. Comprueba que las variables de entorno están bien configuradas');
    }
}

// Ejecutar el script
seedCards()
    .then(() => {
        console.log('✅ Script finalizado');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Error en la ejecución del script:', error);
        process.exit(1);
    }); 