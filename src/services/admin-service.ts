import { adminAuth, adminFirestore, adminStorage } from '../lib/firebase-admin';

/**
 * Servicio para realizar operaciones administrativas en Firebase
 */
export class AdminService {
    /**
     * Obtiene una lista de todos los usuarios
     * @param limit - Número máximo de usuarios a obtener
     * @returns Lista de usuarios
     */
    static async getAllUsers(limit = 100) {
        try {
            const listUsersResult = await adminAuth.listUsers(limit);
            return listUsersResult.users.map(user => ({
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL,
                createdAt: user.metadata.creationTime,
                lastSignIn: user.metadata.lastSignInTime,
                customClaims: user.customClaims
            }));
        } catch (error) {
            console.error('Error al obtener usuarios:', error);
            throw new Error('No se pudieron obtener los usuarios');
        }
    }

    /**
     * Otorga rol de administrador a un usuario
     * @param uid - ID del usuario
     */
    static async setAdminRole(uid: string) {
        try {
            await adminAuth.setCustomUserClaims(uid, { admin: true });

            // También actualizar en Firestore
            await adminFirestore.collection('users').doc(uid).update({
                role: 'admin',
                updatedAt: new Date().toISOString()
            });

            return { success: true, message: 'Rol de administrador otorgado correctamente' };
        } catch (error) {
            console.error('Error al otorgar rol de administrador:', error);
            throw new Error('No se pudo otorgar el rol de administrador');
        }
    }

    /**
     * Otorga rol de staff a un usuario
     * @param uid - ID del usuario
     */
    static async setStaffRole(uid: string) {
        try {
            await adminAuth.setCustomUserClaims(uid, { staff: true });

            // También actualizar en Firestore
            await adminFirestore.collection('users').doc(uid).update({
                role: 'staff',
                updatedAt: new Date().toISOString()
            });

            return { success: true, message: 'Rol de staff otorgado correctamente' };
        } catch (error) {
            console.error('Error al otorgar rol de staff:', error);
            throw new Error('No se pudo otorgar el rol de staff');
        }
    }

    /**
     * Establece el rol de un usuario a "user" (rol por defecto)
     * @param uid - ID del usuario
     */
    static async setDefaultUserRole(uid: string) {
        try {
            // Reiniciar claims a los valores por defecto (sin admin ni staff)
            await adminAuth.setCustomUserClaims(uid, { user: true });

            // También actualizar en Firestore
            await adminFirestore.collection('users').doc(uid).update({
                role: 'user',
                updatedAt: new Date().toISOString()
            });

            return { success: true, message: 'Rol de usuario establecido correctamente' };
        } catch (error) {
            console.error('Error al establecer rol de usuario:', error);
            throw new Error('No se pudo establecer el rol de usuario');
        }
    }

    /**
     * Elimina un usuario y todos sus datos
     * @param uid - ID del usuario
     */
    static async deleteUser(uid: string) {
        try {
            // Eliminar documentos asociados en Firestore
            const userDecks = await adminFirestore.collection('decks').where('userId', '==', uid).get();

            // Batch para eliminar múltiples documentos
            const batch = adminFirestore.batch();

            userDecks.docs.forEach(doc => {
                batch.delete(doc.ref);
            });

            // Eliminar el documento del usuario
            batch.delete(adminFirestore.collection('users').doc(uid));

            // Ejecutar el batch
            await batch.commit();

            // Eliminar el usuario de Authentication
            await adminAuth.deleteUser(uid);

            // Eliminar archivos de Storage (opcional)
            const files = await adminStorage.getFiles({ prefix: `users/${uid}/` });
            if (files[0].length > 0) {
                await Promise.all(files[0].map(file => file.delete()));
            }

            return { success: true, message: 'Usuario eliminado correctamente' };
        } catch (error) {
            console.error('Error al eliminar usuario:', error);
            throw new Error('No se pudo eliminar el usuario');
        }
    }

    /**
     * Genera un reporte de actividad de usuarios
     */
    static async generateUserActivityReport() {
        try {
            const users = await this.getAllUsers();
            const now = new Date();
            const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

            const activeUsers = users.filter(user => {
                if (!user.lastSignIn) return false;
                const lastSignIn = new Date(user.lastSignIn);
                return lastSignIn >= thirtyDaysAgo;
            });

            const inactiveUsers = users.filter(user => {
                if (!user.lastSignIn) return true;
                const lastSignIn = new Date(user.lastSignIn);
                return lastSignIn < thirtyDaysAgo;
            });

            // Guardar el reporte en Firestore
            await adminFirestore.collection('reports').doc('user-activity').set({
                totalUsers: users.length,
                activeUsers: activeUsers.length,
                inactiveUsers: inactiveUsers.length,
                activeUsersPercentage: (activeUsers.length / users.length) * 100,
                generatedAt: new Date().toISOString()
            });

            return {
                totalUsers: users.length,
                activeUsers: activeUsers.length,
                inactiveUsers: inactiveUsers.length,
                activeUsersPercentage: (activeUsers.length / users.length) * 100
            };
        } catch (error) {
            console.error('Error al generar reporte de actividad:', error);
            throw new Error('No se pudo generar el reporte de actividad');
        }
    }
} 