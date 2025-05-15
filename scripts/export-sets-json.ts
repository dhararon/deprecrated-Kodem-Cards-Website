import { initializeApp, cert, getApps, deleteApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as dotenv from 'dotenv';
import { existsSync, writeFileSync } from 'fs';
import path from 'path';

// Función auxiliar para crear un timeout
function timeout(ms: number): Promise<never> {
  return new Promise((_, reject) => 
    setTimeout(() => reject(new Error(`Timeout: La operación excedió ${ms}ms`)), ms)
  );
}

// Cargar variables de entorno (.env.production tiene prioridad)
const prodEnvPath = path.resolve(process.cwd(), '.env.production');
const devEnvPath = path.resolve(process.cwd(), '.env.local');

if (existsSync(prodEnvPath)) {
  console.log(`Cargando variables de entorno desde: ${prodEnvPath}`);
  dotenv.config({ path: prodEnvPath });
} else if (existsSync(devEnvPath)) {
  console.log(`Cargando variables de entorno desde: ${devEnvPath}`);
  dotenv.config({ path: devEnvPath });
} else {
  console.warn('No se encontró ningún archivo .env.production o .env.local');
}

// Configuración del proyecto
const projectId = process.env.VITE_FIREBASE_PROJECT_ID || 'kodemcards';
console.log(`Utilizando Project ID: ${projectId}`);

// Buscar si existe una app con el mismo nombre y eliminarla
const existingApp = getApps().find(app => app.name === 'export-sets-app');
if (existingApp) {
  console.log('Eliminando app existente con el mismo nombre');
  try {
    deleteApp(existingApp);
    console.log('App anterior eliminada correctamente');
  } catch (error) {
    console.warn('No se pudo eliminar la app anterior, pero continuaremos:', error.message);
  }
}

// Determinar la ruta del archivo de servicio
const serviceAccountPath = path.resolve(process.cwd(), 'serviceAccount.json');
console.log(`Buscando archivo de credenciales en: ${serviceAccountPath}`);

if (!existsSync(serviceAccountPath)) {
  console.error('❌ No se encontró el archivo serviceAccount.json');
  console.error('Por favor, descarga un archivo de credenciales desde la consola de Firebase:');
  console.error('1. Ve a Consola de Firebase > Configuración del proyecto > Cuentas de servicio');
  console.error('2. Haz clic en "Generar nueva clave privada"');
  console.error('3. Guarda el archivo como "serviceAccount.json" en el directorio del proyecto');
  process.exit(1);
}

// Inicializar Firebase Admin con el archivo de servicio
let app;
let db;

try {
  console.log('Inicializando Firebase Admin con archivo de servicio');
  const serviceAccount = require(serviceAccountPath);
  
  app = initializeApp({
    credential: cert(serviceAccount),
    projectId: serviceAccount.project_id || projectId
  }, 'export-sets-app');
  
  db = getFirestore(app);
  console.log('✅ Firebase inicializado correctamente');
} catch (error) {
  console.error('❌ Error al inicializar Firebase:', error);
  console.error('Detalles del error:', error.message);
  process.exit(1);
}

async function main() {
  console.log('📊 Exportando información de sets desde Firestore...');
  
  try {
    // Primero hacer una consulta muy pequeña para verificar conectividad
    console.log('🔄 Verificando conexión a Firestore...');
    const TEST_TIMEOUT_MS = 15000; // 15 segundos para la prueba
    
    try {
      await Promise.race([
        db.collection('cards').limit(1).get(),
        timeout(TEST_TIMEOUT_MS)
      ]);
      console.log('✅ Conexión a Firestore verificada correctamente');
    } catch (err) {
      if (err.message && err.message.includes('Timeout')) {
        console.error("⚠️ La conexión de prueba ha fallado. Podría haber problemas de conectividad.");
        console.error("Intentando consulta principal de todas formas...");
      } else {
        throw err; // Re-lanzar errores que no sean de timeout
      }
    }
    
    // Implementar una estrategia de paginación
    console.log('🔍 Consultando colección "cards" con paginación...');
    
    const BATCH_SIZE = 500; // Tamaño de cada lote
    const TIMEOUT_MS = 120000; // 2 minutos
    console.log(`Estableciendo timeout de ${TIMEOUT_MS/1000} segundos para la consulta completa...`);
    
    const setsCount: Record<string, number> = {};
    let totalDocuments = 0;
    let lastDoc = null;
    let hasMoreDocs = true;
    let batchNumber = 1;
    
    while (hasMoreDocs) {
      console.log(`📄 Obteniendo lote #${batchNumber} (${BATCH_SIZE} documentos)...`);
      
      let query = db.collection('cards').limit(BATCH_SIZE);
      if (lastDoc) {
        query = query.startAfter(lastDoc);
      }
      
      // Usar timeout para esta consulta de lote
      const batchPromise = Promise.race([
        query.get(),
        timeout(60000) // 1 minuto por lote
      ]);
      
      const batchSnapshot = await batchPromise;
      
      if (batchSnapshot.empty) {
        hasMoreDocs = false;
        console.log('🏁 No hay más documentos para procesar');
      } else {
        // Procesar este lote
        batchSnapshot.forEach((doc) => {
          const data = doc.data();
          const setName = data.setName || "Sin set";
          setsCount[setName] = (setsCount[setName] || 0) + 1;
        });
        
        totalDocuments += batchSnapshot.size;
        
        // Almacenar el último documento para la próxima consulta
        lastDoc = batchSnapshot.docs[batchSnapshot.docs.length - 1];
        
        // Si tenemos menos documentos que el tamaño del lote, no hay más
        if (batchSnapshot.size < BATCH_SIZE) {
          hasMoreDocs = false;
          console.log('🏁 Último lote procesado (menos documentos que el tamaño del lote)');
        }
        
        console.log(`✅ Lote #${batchNumber} procesado: ${batchSnapshot.size} documentos`);
        batchNumber++;
      }
    }
    
    console.log(`✅ Total de documentos recuperados: ${totalDocuments}`);
    
    if (totalDocuments === 0) {
      console.warn('⚠️ La colección está vacía. No hay sets para exportar.');
      process.exit(0);
    }

    const sets = Object.entries(setsCount)
      .map(([setName, count]) => ({ setName, count }))
      .sort((a, b) => a.setName.localeCompare(b.setName));

    // Crear directorio api si no existe
    const apiDir = path.resolve(process.cwd(), 'src/pages/api');
    if (!existsSync(apiDir)) {
      const fs = require('fs');
      fs.mkdirSync(apiDir, { recursive: true });
      console.log(`📁 Creado directorio: ${apiDir}`);
    }

    const outputPath = path.resolve(process.cwd(), 'src/pages/api/sets.json');
    writeFileSync(outputPath, JSON.stringify(sets, null, 2));
    
    console.log(`✅ Archivo JSON generado en: ${outputPath}`);
    console.log(`Contiene información de ${sets.length} sets diferentes.`);
  } catch (err) {
    if (err.message && err.message.includes('Timeout')) {
      console.error("⏱️ Error: La consulta a Firestore excedió el tiempo límite.");
      console.error("Esto puede deberse a una conexión lenta o a problemas de acceso a Firestore.");
      console.error("Prueba con las siguientes soluciones:");
      console.error("1. Verifica tu conexión a internet");
      console.error("2. Comprueba que las credenciales tienen permisos de lectura en Firestore");
      console.error("3. Aumenta el valor de TIMEOUT_MS en el código (actualmente 120000 ms)");
      console.error("4. Si la colección 'cards' es muy grande, considera filtrar o limitar los resultados");
    } else {
      console.error("❌ Error exportando sets:", err);
      console.error("Detalles del error:", err.message);
      console.error("Stack:", err.stack);
      
      // Si hay un error de permisos, dar consejos específicos
      if (err.message && (err.message.includes('permission') || err.message.includes('access') || err.message.includes('denied'))) {
        console.error("\n🔑 Posible problema de permisos. Verificaciones sugeridas:");
        console.error("1. Confirma que tu cuenta de servicio tiene el rol 'Editor de Firestore' o superior");
        console.error("2. Verifica que las reglas de seguridad permitan la lectura desde aplicaciones de servidor");
        console.error("3. Asegúrate de que estás usando el proyecto correcto en Firebase");
      }
    }
    process.exit(1);
  }
}

main();