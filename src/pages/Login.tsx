import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLocation } from 'wouter';
import { signInWithPopup, getIdTokenResult } from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import { Button } from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';
import { Label } from '@/components/atoms/Label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose, DialogFooter } from '@/components/atoms/Dialog';
import { Separator } from '@/components/atoms/Separator';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [resetEmail, setResetEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isResetLoading, setIsResetLoading] = useState(false);
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);
    const [error, setError] = useState('');
    const [resetDialogOpen, setResetDialogOpen] = useState(false);
    const { login, resetPassword } = useAuth();
    const [, navigate] = useLocation();

    // Iniciar sesión con email y contraseña
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const trimmedEmail = email.trim();
            await login(trimmedEmail, password);
            
            // Añadir un pequeño retraso antes de navegar para asegurar que
            // el estado de autenticación se ha actualizado completamente
            setTimeout(() => {
                navigate('/');
            }, 300);
        } catch (err) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('Ocurrió un error al iniciar sesión');
            }
        } finally {
            setIsLoading(false);
        }
    };

    // Iniciar sesión con Google
    const handleGoogleLogin = async () => {
        setIsGoogleLoading(true);
        setError('');

        try {
            // Autenticar con Google
            const result = await signInWithPopup(auth, googleProvider);
            // Obtener los claims del token
            const tokenResult = await getIdTokenResult(result.user);
            // Guardar los claims en localStorage
            localStorage.setItem('auth_claims', JSON.stringify(tokenResult.claims));
            // Navegar a la página principal
            navigate('/');
        } catch (err) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('Error al iniciar sesión con Google');
            }
        } finally {
            setIsGoogleLoading(false);
        }
    };

    // Resetear contraseña
    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!resetEmail.trim()) {
            setError('Por favor, ingresa tu dirección de email');
            return;
        }

        setIsResetLoading(true);
        try {
            const trimmedEmail = resetEmail.trim();
            await resetPassword(trimmedEmail);
            setResetDialogOpen(false);
            setResetEmail('');
        } catch (err) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('Error al enviar el correo de restablecimiento');
            }
        } finally {
            setIsResetLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md">
                <div className="text-center">
                    <h1 className="text-3xl font-bold">Iniciar Sesión</h1>
                    <p className="mt-2 text-gray-600">
                        Ingresa tus credenciales para acceder al dashboard
                    </p>
                </div>

                {error && (
                    <div className="p-3 text-sm text-red-800 bg-red-100 rounded-md">
                        {error}
                    </div>
                )}

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div>
                        <Label htmlFor="email" className="block text-sm font-medium text-gray-700">
                            Email
                        </Label>
                        <div className="mt-1">
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                onBlur={(e) => setEmail(e.target.value.trim())}
                                className="w-full"
                                placeholder="tu@email.com"
                                disabled={isLoading}
                            />
                        </div>
                    </div>

                    <div>
                        <div className="flex items-center justify-between">
                            <Label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                Contraseña
                            </Label>
                            <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
                                <DialogTrigger asChild>
                                    <button
                                        type="button"
                                        className="text-sm text-primary hover:underline focus:outline-none"
                                    >
                                        ¿Olvidaste tu contraseña?
                                    </button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Restablecer contraseña</DialogTitle>
                                    </DialogHeader>
                                    <form onSubmit={handleResetPassword} className="space-y-4 py-4">
                                        <div>
                                            <Label htmlFor="reset-email">
                                                Email
                                            </Label>
                                            <Input
                                                id="reset-email"
                                                type="email"
                                                value={resetEmail}
                                                onChange={(e) => setResetEmail(e.target.value)}
                                                onBlur={(e) => setResetEmail(e.target.value.trim())}
                                                placeholder="tu@email.com"
                                                className="w-full mt-1"
                                                required
                                            />
                                        </div>
                                        <DialogFooter className="flex justify-end space-x-2 pt-4">
                                            <DialogClose asChild>
                                                <Button variant="outline" type="button">
                                                    Cancelar
                                                </Button>
                                            </DialogClose>
                                            <Button
                                                type="submit"
                                                disabled={isResetLoading}
                                            >
                                                {isResetLoading ? 'Enviando...' : 'Enviar correo'}
                                            </Button>
                                        </DialogFooter>
                                    </form>
                                </DialogContent>
                            </Dialog>
                        </div>
                        <div className="mt-1">
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full"
                                disabled={isLoading}
                            />
                        </div>
                    </div>

                    <div>
                        <Button
                            type="submit"
                            className="w-full"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                        </Button>
                    </div>
                </form>

                <Separator className="my-6" />

                <div>
                    <Button
                        type="button"
                        variant="outline"
                        className="w-full flex items-center justify-center bg-white border-gray-300 hover:bg-gray-50"
                        onClick={handleGoogleLogin}
                        disabled={isGoogleLoading}
                    >
                        <svg viewBox="0 0 24 24" className="w-5 h-5 mr-2">
                            <path
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                fill="#4285F4"
                            />
                            <path
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                fill="#34A853"
                            />
                            <path
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                fill="#FBBC05"
                            />
                            <path
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                fill="#EA4335"
                            />
                        </svg>
                        <span className="text-gray-800">
                            {isGoogleLoading ? 'Conectando...' : 'Continuar con Google'}
                        </span>
                    </Button>
                </div>

                <div className="text-center mt-4">
                    <p className="text-sm text-gray-600">
                        ¿No tienes una cuenta?{' '}
                        <button
                            type="button"
                            onClick={() => navigate('/register')}
                            className="text-primary hover:underline focus:outline-none"
                        >
                            Regístrate
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
} 