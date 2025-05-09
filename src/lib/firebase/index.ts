import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, connectAuthEmulator, getIdTokenResult } from 'firebase/auth';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { firebaseConfig, emulatorConfig, shouldUseEmulators } from './config';

// Verificar si ya existe una instancia de Firebase e inicializarla solo si no existe
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Obtener servicios
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

// Bandera para determinar si estamos usando emuladores
export const isUsingEmulators = shouldUseEmulators();

/**
 * Función auxiliar para forzar la actualización de los claims al iniciar la aplicación
 */
export const verifyAuthClaims = async () => {
    try {
        const currentUser = auth.currentUser;
        if (!currentUser) {
            console.log('No hay usuario autenticado para verificar claims');
            return null;
        }

        console.log('Verificando claims al inicio de la aplicación...');
        console.log('Usuario actual:', currentUser.email);

        // Forzar la actualización del token con espera para entorno de producción
        await currentUser.getIdToken(true);

        // Esperar un poco para asegurar la propagación de tokens
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Obtener el resultado del token con forceRefresh
        const tokenResult = await getIdTokenResult(currentUser, true);

        console.log('Claims verificados exitosamente:', tokenResult.claims);
        console.log('Firebase Auth Time:', new Date(Number(tokenResult.authTime) * 1000).toISOString());
        console.log('Firebase Token Issued:', new Date(Number(tokenResult.issuedAtTime) * 1000).toISOString());
        console.log('Firebase Token Expires:', new Date(Number(tokenResult.expirationTime) * 1000).toISOString());

        // Guardar claims en localStorage
        localStorage.setItem('auth_claims', JSON.stringify(tokenResult.claims));

        return tokenResult.claims;
    } catch (error) {
        console.error('Error al verificar claims:', error);
        return null;
    }
};

// Conectar a los emuladores si estamos en entorno de desarrollo
if (shouldUseEmulators()) {
    console.log('🔥 Configurando emuladores de Firebase');

    // Emulador de Firestore
    try {
        connectFirestoreEmulator(
            db,
            emulatorConfig.firestore.host,
            emulatorConfig.firestore.port
        );
        console.log(`✅ Emulador de Firestore conectado en ${emulatorConfig.firestore.host}:${emulatorConfig.firestore.port}`);
    } catch (error) {
        console.error('❌ Error al conectar con el emulador de Firestore:', error);
    }

    // Emulador de Auth
    try {
        connectAuthEmulator(auth, emulatorConfig.auth.url);
        console.log(`✅ Emulador de Auth conectado en ${emulatorConfig.auth.url}`);
    } catch (error) {
        console.error('❌ Error al conectar con el emulador de Auth:', error);
    }

    // Emulador de Storage
    try {
        connectStorageEmulator(
            storage,
            emulatorConfig.storage.host,
            emulatorConfig.storage.port
        );
        console.log(`✅ Emulador de Storage conectado en ${emulatorConfig.storage.host}:${emulatorConfig.storage.port}`);
    } catch (error) {
        console.error('❌ Error al conectar con el emulador de Storage:', error);
    }
}

export default app; 