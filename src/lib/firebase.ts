import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, connectAuthEmulator, getIdTokenResult } from 'firebase/auth';
import {
    connectFirestoreEmulator,
    enableIndexedDbPersistence,
    initializeFirestore,
    CACHE_SIZE_UNLIMITED,
    setDoc,
    doc
} from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

// Verificar si se deben usar emuladores (a través de variables de entorno)
// Comprobamos múltiples fuentes para mayor flexibilidad
const isUsingEmulators =
    import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true' ||
    import.meta.env.FORCE_USE_EMULATORS === 'true' ||
    process.env.FORCE_USE_EMULATORS === 'true';

// Para depuración
console.log(`🔥 Firebase: ${isUsingEmulators ? 'Usando emuladores' : 'Usando servicios reales'}`);

const isDev = import.meta.env.DEV;

// Firebase configuration using environment variables for security
// Si estamos usando emuladores, usar configuración falsa para evitar errores
const firebaseConfig = isUsingEmulators
    ? {
        apiKey: "fake-api-key-for-emulators",
        authDomain: "fake-auth-domain-for-emulators",
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
        storageBucket: "fake-storage-bucket-for-emulators",
        messagingSenderId: "fake-sender-id-for-emulators",
        appId: "fake-app-id-for-emulators"
    }
    : {
        apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
        authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
        storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
        appId: import.meta.env.VITE_FIREBASE_APP_ID
    };

// Initialize Firebase - Verificar si ya existe una instancia
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

// Inicializar Firestore con parámetros para mejor manejo de conexiones
const db = initializeFirestore(app, {
    cacheSizeBytes: CACHE_SIZE_UNLIMITED,
    experimentalForceLongPolling: true // Usa long polling en lugar de WebSocket para mayor compatibilidad
});

const storage = getStorage(app);

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

// Configurar emuladores si la variable de entorno está activada
if (isUsingEmulators) {
    try {
        // Usar URLs desde variables de entorno si están disponibles, o valores por defecto
        const authEmulatorUrl = import.meta.env.VITE_FIREBASE_AUTH_EMULATOR_URL || 'http://localhost:9099';
        const firestoreHost = import.meta.env.VITE_FIREBASE_FIRESTORE_EMULATOR_HOST || 'localhost';
        const firestorePort = parseInt(import.meta.env.VITE_FIREBASE_FIRESTORE_EMULATOR_PORT || '8080');
        const storageHost = import.meta.env.VITE_FIREBASE_STORAGE_EMULATOR_HOST || 'localhost';
        const storagePort = parseInt(import.meta.env.VITE_FIREBASE_STORAGE_EMULATOR_PORT || '9199');

        // Conectar con los emuladores
        console.log(`🔥 Firebase Auth: Conectando a emulador en ${authEmulatorUrl}`);
        connectAuthEmulator(auth, authEmulatorUrl, { disableWarnings: true });

        console.log(`🔥 Firebase Firestore: Conectando a emulador en ${firestoreHost}:${firestorePort}`);
        connectFirestoreEmulator(db, firestoreHost, firestorePort);

        console.log(`🔥 Firebase Storage: Conectando a emulador en ${storageHost}:${storagePort}`);
        connectStorageEmulator(storage, storageHost, storagePort);

        // Inicializar datos de prueba en el emulador para desarrollo
        const initEmulatorData = async () => {
            try {
                // Crear documento system/config para indicar que estamos en modo emulador
                await setDoc(doc(db, 'system', 'config'), {
                    useEmulator: true,
                    initAt: new Date().toISOString(),
                    environment: 'development'
                });
                
                // Marcar documentos como del emulador para las reglas de seguridad (compatibilidad con versión anterior)
                await setDoc(doc(db, 'system', 'info'), {
                    emulator: true,
                    initAt: new Date().toISOString()
                });
                
                // Crear un usuario administrador de prueba si no existe
                const testAdminUid = 'test-admin-user';
                await setDoc(doc(db, 'users', testAdminUid), {
                    email: 'admin@example.com',
                    displayName: 'Admin Usuario',
                    role: 'admin',
                    emulator: true,
                    createdAt: new Date().toISOString()
                }, { merge: true });
                
                console.log('✅ Datos de prueba inicializados en el emulador');
            } catch (error) {
                console.error('Error al inicializar datos de prueba:', error);
            }
        };

        // Solo inicializar datos si estamos en desarrollo
        if (isDev) {
            initEmulatorData();
        }
    } catch (error) {
        console.error('Error al conectar con emuladores:', error);
    }
} else {
    // Configuración de persistencia para Firestore (solo en producción)
    try {
        enableIndexedDbPersistence(db).catch((err) => {
            if (err.code === 'failed-precondition') {
                console.warn('La persistencia falló, posiblemente múltiples pestañas abiertas.');
            } else if (err.code === 'unimplemented') {
                console.warn('Este navegador no soporta persistencia en IndexedDB.');
            } else {
                console.error('Error al habilitar persistencia:', err);
            }
        });
    } catch (error) {
        console.error('Error general al configurar persistencia:', error);
    }
}

// Configurar el proveedor de Google
const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('profile');
googleProvider.addScope('email');
googleProvider.setCustomParameters({
    prompt: 'select_account'
});

// Exportamos instancias ya configuradas
export { auth, db, storage, googleProvider, isUsingEmulators, isDev };
export default app; 