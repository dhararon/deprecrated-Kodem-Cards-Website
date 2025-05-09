/// <reference types="jest" />

import '@testing-library/jest-dom';
import { TextDecoder, TextEncoder } from 'util';

// Mocks para Firebase
jest.mock('@/lib/firebase', () => {
    return {
        db: {
            collection: jest.fn().mockReturnThis(),
            doc: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            orderBy: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
            get: jest.fn().mockResolvedValue({
                docs: [],
                forEach: jest.fn(),
                empty: true,
            }),
            add: jest.fn().mockResolvedValue({ id: 'mock-id' }),
            set: jest.fn().mockResolvedValue({}),
            update: jest.fn().mockResolvedValue({}),
            delete: jest.fn().mockResolvedValue({}),
        },
        auth: {
            currentUser: null,
            onAuthStateChanged: jest.fn().mockImplementation(cb => {
                cb(null);
                return jest.fn();
            }),
            signInWithEmailAndPassword: jest.fn(),
            createUserWithEmailAndPassword: jest.fn(),
            signOut: jest.fn(),
        },
        isUsingEmulators: false,
        serverTimestamp: () => ({ toDate: () => new Date() }),
    };
});

// Mock para localStorage
const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
        getItem: jest.fn((key: string) => store[key] || null),
        setItem: jest.fn((key: string, value: string) => {
            store[key] = value.toString();
        }),
        removeItem: jest.fn((key: string) => {
            delete store[key];
        }),
        clear: jest.fn(() => {
            store = {};
        }),
        key: jest.fn((idx: number) => Object.keys(store)[idx] || null),
        length: jest.fn(() => Object.keys(store).length),
    };
})();

Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
});

// Mock para matchMedia
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
    })),
});

// Mock para TextEncoder/TextDecoder
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as any;

// Silenciar las advertencias de console.error y console.warn en los tests
// pero manteniendo el feedback en caso de errores
const originalError = console.error;
const originalWarn = console.warn;

console.error = (...args) => {
    if (
        typeof args[0] === 'string' &&
        (args[0].includes('Warning: ReactDOM.render') ||
            args[0].includes('Warning: React.createElement') ||
            args[0].includes('Warning: Each child in a list'))
    ) {
        return;
    }
    originalError(...args);
};

console.warn = (...args) => {
    if (
        typeof args[0] === 'string' &&
        (args[0].includes('Warning: useEffect') ||
            args[0].includes('Warning: React.createFactory'))
    ) {
        return;
    }
    originalWarn(...args);
}; 