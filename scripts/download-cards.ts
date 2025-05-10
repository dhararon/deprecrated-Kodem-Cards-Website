/**
 * Script para descargar todas las cartas de Firestore DE PRODUCCIÓN y guardarlas como fixture
 * 
 * IMPORTANTE: Este script requiere que proporciones las credenciales de Firebase en el archivo .env
 * o directamente como argumentos al ejecutar el script.
 * 
 * Uso:
 * bun run download-cards
 * 
 * O con credenciales directas:
 * FIREBASE_AUTH_EMAIL=tu_email FIREBASE_AUTH_PASSWORD=tu_password bun run download-cards
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, orderBy } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword, signInAnonymously } from 'firebase/auth';
import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';
import * as dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

// Obtener credenciales, primero de argumentos, luego de variables de entorno
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID || 'kodemcards',
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID || process.env.VITE_FIREBASE_APP_ID,
  measurementId: process.env.FIREBASE_MEASUREMENT_ID || process.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Obtener credenciales de autenticación (si están disponibles)
const authEmail = process.env.FIREBASE_AUTH_EMAIL || process.env.VITE_FIREBASE_AUTH_EMAIL;
const authPassword = process.env.FIREBASE_AUTH_PASSWORD || process.env.VITE_FIREBASE_AUTH_PASSWORD;

/**
 * Función principal para descargar cartas de la instancia de PRODUCCIÓN
 */
async function downloadCards() {
  // Verificar si tenemos credenciales suficientes
  const hasCredentials = !!authEmail && !!authPassword;
  
  if (!hasCredentials) {
    console.log('⚠️ No se proporcionaron credenciales de autenticación.');
    console.log('❗ Según las reglas de Firestore, necesitas estar autenticado para leer las cartas.');
    
    // Intentar usar un archivo local existente como respaldo
    return useFallbackCardsFile();
  }
  
  console.log('🔄 Inicializando conexión a Firebase PRODUCCIÓN...');
  console.log(`📌 Proyecto: ${firebaseConfig.projectId}`);
  
  // Inicializar Firebase con las credenciales de producción
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  const auth = getAuth(app);
  
  try {
    // Intentar autenticarse con las credenciales proporcionadas
    console.log(`🔑 Autenticando con cuenta: ${authEmail}...`);
    await signInWithEmailAndPassword(auth, authEmail, authPassword);
    console.log('✅ Autenticación exitosa');
    
    // Obtener todas las cartas, ordenadas por nombre
    console.log('📥 Descargando cartas de Firestore PRODUCCIÓN...');
    const cardsCollection = 'cards'; // Nombre de la colección
    const cardsQuery = query(
      collection(db, cardsCollection),
      orderBy('name')
    );
    
    console.log('⏳ Esperando respuesta de Firestore...');
    const snapshot = await getDocs(cardsQuery);
    
    if (snapshot.empty) {
      console.warn('⚠️ No se encontraron cartas en la base de datos de producción');
      console.warn('Verifica que:');
      console.warn('1. La colección "cards" exista');
      console.warn('2. Tengas permisos para leer esa colección');
      
      // Intentar usar un archivo local existente como respaldo
      return useFallbackCardsFile();
    }
    
    console.log(`✅ Descargadas ${snapshot.docs.length} cartas`);
    
    // Preparar los datos para guardar
    const cards = snapshot.docs.map(doc => {
      return {
        id: doc.id,
        ...doc.data()
      };
    });
    
    // Guardar los resultados
    return saveCardsToFiles(cards);
    
  } catch (error) {
    console.error('❌ Error al descargar cartas:', error);
    
    // Añadir información útil para depuración
    if (error instanceof Error) {
      if (error.message.includes('permission-denied')) {
        console.error('🔒 ERROR DE PERMISOS: No tienes permisos suficientes para acceder a esta colección');
        console.error('Según las reglas de Firestore ("firebase/firestore-rules/firestore.rules"), necesitas:');
        console.error('1. Estar autenticado (tienes que proporcionar credenciales válidas)');
        console.error('2. Tener privilegios suficientes (el usuario debe tener acceso a la colección "cards")');
        console.error('');
        console.error('SOLUCIÓN: Proporciona credenciales de un usuario con permisos:');
        console.error('FIREBASE_AUTH_EMAIL=tu@email.com FIREBASE_AUTH_PASSWORD=tu_contraseña bun run download-cards');
      } else if (error.message.includes('network')) {
        console.error('🌐 ERROR DE RED: No se pudo conectar a Firebase');
        console.error('Verifica tu conexión a internet');
      } else if (error.message.includes('auth/invalid-credential') || error.message.includes('auth/wrong-password')) {
        console.error('🔑 ERROR DE AUTENTICACIÓN: Las credenciales proporcionadas no son válidas');
        console.error('Verifica que el correo y contraseña sean correctos');
      } else if (error.message.includes('auth/user-not-found')) {
        console.error('👤 ERROR DE USUARIO: El usuario proporcionado no existe');
        console.error('Verifica que el correo electrónico sea correcto');
      }
    }
    
    // Intentar usar un archivo local existente como respaldo
    return useFallbackCardsFile();
  }
}

/**
 * Guarda las cartas en archivos JSON
 */
function saveCardsToFiles(cards) {
  // Asegurar que cards es un array
  const cardsArray = Array.isArray(cards) ? cards : [];
  const cardCount = cardsArray.length || 0;
  
  // Crear directorio de fixtures si no existe
  const fixturesDir = join(process.cwd(), 'fixtures');
  mkdirSync(fixturesDir, { recursive: true });
  
  // Guardar en un archivo JSON
  const timestamp = new Date().toISOString().replace(/:/g, '-');
  const outputPath = join(fixturesDir, `cards-prod-${timestamp}.json`);
  
  console.log(`💾 Guardando datos en ${outputPath}`);
  writeFileSync(outputPath, JSON.stringify(cardsArray, null, 2));
  
  // También guardar una copia con nombre fijo para facilitar las importaciones
  const latestPath = join(fixturesDir, 'cards-latest.json');
  writeFileSync(latestPath, JSON.stringify(cardsArray, null, 2));
  
  console.log('✨ ¡Datos guardados exitosamente!');
  console.log(`- Cartas guardadas: ${cardCount}`);
  console.log(`- Archivo con fecha: ${outputPath}`);
  console.log(`- Archivo más reciente: ${latestPath}`);
}

/**
 * Utiliza un archivo de cartas existente como respaldo cuando no se puede conectar a Firestore
 */
function useFallbackCardsFile() {
  console.log('🔄 Buscando archivo local de cartas como respaldo...');
  
  const fallbackPath = join(process.cwd(), 'fixtures', 'cards.json');
  
  if (!existsSync(fallbackPath)) {
    console.error('❌ No se encontró archivo local de respaldo en:', fallbackPath);
    console.error('No se pudieron obtener las cartas de ninguna fuente.');
    process.exit(1);
  }
  
  try {
    console.log('📄 Se encontró un archivo local de cartas:', fallbackPath);
    const cardsData = readFileSync(fallbackPath, 'utf8');
    let cardsArray = [];
    
    try {
      const parsedData = JSON.parse(cardsData);
      
      // Determinar si el JSON es un array o un objeto con cartas
      if (Array.isArray(parsedData)) {
        cardsArray = parsedData;
      } else if (typeof parsedData === 'object' && parsedData !== null) {
        // Intentar extraer un array si está en alguna propiedad
        const possibleArrays = Object.values(parsedData).filter(Array.isArray);
        if (possibleArrays.length > 0) {
          cardsArray = possibleArrays[0]; // Usar el primer array encontrado
        } else {
          // Convertir el objeto a un array de valores si no hay arrays
          cardsArray = Object.values(parsedData);
        }
      }
    } catch (parseError) {
      console.error('❌ Error al analizar el archivo JSON:', parseError);
      process.exit(1);
    }
    
    console.log(`✅ Cargadas ${cardsArray.length} cartas desde el archivo local`);
    
    // Guardar una copia con el formato actualizado
    saveCardsToFiles(cardsArray);
    
    console.log('⚠️ NOTA: Estos datos provienen de un archivo local, no de Firestore.');
    console.log('Para descargar datos actualizados de Firestore, proporciona credenciales válidas.');
    
    return cardsArray;
  } catch (error) {
    console.error('❌ Error al leer el archivo local de cartas:', error);
    process.exit(1);
  }
}

// Ejecutar la función principal
downloadCards().catch(console.error); 