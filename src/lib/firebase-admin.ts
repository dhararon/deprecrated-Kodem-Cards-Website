import * as admin from 'firebase-admin';
import { getApps } from 'firebase-admin/app';
import * as fs from 'fs';
import * as path from 'path';

// Ruta al archivo de credenciales
const serviceAccountPath = path.resolve(process.cwd(), 'kodemcards-firebase-adminsdk-fbsvc-93b3d288b1.json');

// Verificar si ya existe una app inicializada
if (!getApps().length) {
    try {
        // Leer el archivo de credenciales
        const serviceAccount = JSON.parse(
            fs.readFileSync(serviceAccountPath, 'utf8')
        );

        // Inicializar la app con las credenciales
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            storageBucket: 'kodemcards.appspot.com' // Usar el mismo bucket de almacenamiento
        });
    } catch (error) {
        console.error('Error al inicializar Firebase Admin SDK:', error);
    }
}

// Exportar las instancias de servicios
export const adminAuth = admin.auth();
export const adminFirestore = admin.firestore();
export const adminStorage = admin.storage().bucket();

export default admin; 