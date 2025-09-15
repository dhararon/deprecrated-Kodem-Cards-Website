import React from 'react';
import { useAuth } from '@/context/auth/useAuth';
import { AlertTriangle, Database, Server } from 'lucide-react';

/**
 * Componente que muestra un banner cuando la aplicación está conectada a los emuladores de Firebase
 */
export function EmulatorBanner() {
    const { usingEmulators } = useAuth();

    if (!usingEmulators) return null;

    return (
        <div className="bg-yellow-500/90 text-black px-4 py-2 flex items-center justify-between text-sm sticky top-0 z-50 font-medium">
            <div className="flex items-center gap-2">
                <Server className="h-4 w-4" />
                <span>
                    Modo de desarrollo con emuladores Firebase (datos locales)
                </span>
            </div>

            <div className="flex items-center gap-4">
                <div className="flex items-center gap-1 text-xs bg-yellow-600/50 px-2 py-1 rounded">
                    <Database className="h-3.5 w-3.5" />
                    <span>Firestore: localhost:8080</span>
                </div>

                <div className="flex items-center gap-1 text-xs">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    <span>Los datos no se guardan permanentemente</span>
                </div>
            </div>
        </div>
    );
}

export default EmulatorBanner; 