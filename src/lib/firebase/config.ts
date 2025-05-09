/**
 * Configuración centralizada de Firebase para entornos de desarrollo y producción
 */

// Configuración para entorno de producción
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Configuración para emuladores
export const emulatorConfig = {
  useEmulators: import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true',
  
  firestore: {
    host: import.meta.env.VITE_FIREBASE_FIRESTORE_EMULATOR_HOST || 'localhost',
    port: parseInt(import.meta.env.VITE_FIREBASE_FIRESTORE_EMULATOR_PORT || '8080', 10)
  },
  
  auth: {
    url: import.meta.env.VITE_FIREBASE_AUTH_EMULATOR_URL || 'http://localhost:9099'
  },
  
  storage: {
    host: import.meta.env.VITE_FIREBASE_STORAGE_EMULATOR_HOST || 'localhost',
    port: parseInt(import.meta.env.VITE_FIREBASE_STORAGE_EMULATOR_PORT || '9199', 10)
  }
};

// Nombres de colecciones - centralizada para fácil mantenimiento
export const collections = {
  CARDS: 'cards',
  CARD_TYPES: 'cardTypes',
  CARD_SETS: 'cardSets'
};

// Determinar si estamos en modo desarrollo
export const isDevelopment = import.meta.env.DEV;

// Determinar si debemos usar emuladores
export const shouldUseEmulators = () => {
  if (import.meta.env.FORCE_USE_EMULATORS === 'true') {
    return true;
  }
  
  return isDevelopment && emulatorConfig.useEmulators;
}; 