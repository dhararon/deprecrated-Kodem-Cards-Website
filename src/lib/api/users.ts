// Módulo para operaciones de API relacionadas con usuarios
import { User } from '@/types/user';
import { auth } from '../firebase';

// Mock users para desarrollo
const mockUsers: User[] = [
    {
        id: '1',
        email: 'admin@kodem.com',
        displayName: 'Admin User',
        photoURL: 'https://i.pravatar.cc/150?img=1',
        role: 'admin',
        createdAt: new Date().toISOString()
    },
    {
        id: '2',
        email: 'user@kodem.com',
        displayName: 'Normal User',
        photoURL: 'https://i.pravatar.cc/150?img=2',
        role: 'user',
        createdAt: new Date().toISOString()
    }
];

// Simulación de delay para simular una API real
const simulateApiDelay = () => new Promise<void>(resolve => setTimeout(resolve, 500));

/**
 * Servicio de autenticación para gestionar usuarios
 */

/**
 * Obtiene el usuario actual autenticado
 * @returns Usuario autenticado o null
 */
export const getCurrentUser = async (): Promise<User | null> => {
    return new Promise((resolve) => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            unsubscribe();
            if (user) {
                resolve({
                    id: user.uid,
                    email: user.email || '',
                    displayName: user.displayName || '',
                    photoURL: user.photoURL,
                    role: 'user',
                    createdAt: user.metadata.creationTime
                });
            } else {
                resolve(null);
            }
        });
    });
};

/**
 * Obtiene todos los usuarios del sistema
 * @returns Lista de usuarios
 */
export const getUsers = async (): Promise<User[]> => {
    // En producción, esto se conectaría a Firebase
    return Promise.resolve(mockUsers);
};

/**
 * Obtiene un usuario por su ID
 * @param id ID del usuario
 * @returns Usuario o null si no existe
 */
export const getUserById = async (id: string): Promise<User | null> => {
    const user = mockUsers.find(user => user.id === id);
    return Promise.resolve(user || null);
};

/**
 * Actualiza el perfil de un usuario
 * @param id ID del usuario
 * @param data Datos a actualizar
 * @returns Usuario actualizado
 */
export const updateUserProfile = async (
    id: string,
    data: Partial<User>
): Promise<User> => {
    // Simulamos la actualización
    const userIndex = mockUsers.findIndex(user => user.id === id);

    if (userIndex >= 0) {
        mockUsers[userIndex] = {
            ...mockUsers[userIndex],
            ...data
        };
        return Promise.resolve(mockUsers[userIndex]);
    }

    throw new Error('User not found');
};

/**
 * Elimina un usuario
 * @param id ID del usuario
 * @returns true si se eliminó correctamente
 */
export const deleteUser = async (id: string): Promise<boolean> => {
    const userIndex = mockUsers.findIndex(user => user.id === id);

    if (userIndex >= 0) {
        mockUsers.splice(userIndex, 1);
        return Promise.resolve(true);
    }

    return Promise.resolve(false);
};

/**
 * Autenticar usuario con email y contraseña
 */
export const authenticateUser = async (
    email: string,
    password: string
): Promise<User> => {
    await simulateApiDelay();

    // En un caso real, aquí se haría la validación contra el backend
    const user = mockUsers.find(u => u.email === email);

    if (!user || !(email === 'admin@pdtgrading.com' && password === 'admin123')) {
        throw new Error('Credenciales inválidas');
    }

    return user;
};

/**
 * Obtener perfil del usuario actual
 */
export const getCurrentUserProfile = async (userId: string): Promise<User> => {
    await simulateApiDelay();

    const user = mockUsers.find(u => u.id === userId);

    if (!user) {
        throw new Error('Usuario no encontrado');
    }

    return user;
};

/**
 * Cambiar contraseña de usuario
 */
export const changeUserPassword = async (
    userId: string,
    currentPassword: string,
    _newPassword: string
): Promise<void> => {
    await simulateApiDelay();

    // Validar que el usuario existe
    const user = mockUsers.find(u => u.id === userId);

    if (!user) {
        throw new Error('Usuario no encontrado');
    }

    // Validar contraseña actual (en este ejemplo, siempre es 'admin123')
    if (currentPassword !== 'admin123') {
        throw new Error('La contraseña actual es incorrecta');
    }

    // En un caso real, aquí se actualizaría la contraseña en el backend
    // Usar _newPassword para evitar warning de no uso (no tiene efecto real)
    console.log(`Contraseña del usuario ${userId} actualizada a una nueva de longitud: ${_newPassword.length}`);

    return;
}; 