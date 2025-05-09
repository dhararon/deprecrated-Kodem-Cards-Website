import React, { useState } from 'react';
import { Button } from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';
import { Label } from '@/components/atoms/Label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose, DialogFooter } from '@/components/atoms/Dialog';
import { Separator } from '@/components/atoms/Separator';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export interface LoginFormProps {
    /**
     * Callback cuando se envía el formulario de inicio de sesión
     */
    onLogin: (email: string, password: string) => Promise<void>;

    /**
     * Callback cuando se solicita restablecer la contraseña
     */
    onResetPassword?: (email: string) => Promise<void>;

    /**
     * Callback cuando se solicita inicio de sesión con Google
     */
    onGoogleLogin?: () => Promise<void>;

    /**
     * Callback para navegar a la página de registro
     */
    onRegisterClick?: () => void;

    /**
     * Mensaje de error si la autenticación falla
     */
    error?: string;

    /**
     * Indica si el formulario está en proceso de envío
     */
    isLoading?: boolean;

    /**
     * Indica si el inicio de sesión con Google está en proceso
     */
    isGoogleLoading?: boolean;

    /**
     * Indica si el formulario de restablecimiento de contraseña está en proceso
     */
    isResetLoading?: boolean;
}

/**
 * LoginForm - Formulario de inicio de sesión con soporte para email/contraseña, 
 * restablecimiento de contraseña e inicio de sesión con Google
 */
export function LoginForm({
    onLogin,
    onResetPassword,
    onGoogleLogin,
    onRegisterClick,
    error,
    isLoading = false,
    isGoogleLoading = false,
    isResetLoading = false
}: LoginFormProps) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [resetEmail, setResetEmail] = useState('');
    const [resetDialogOpen, setResetDialogOpen] = useState(false);
    const [formError, setFormError] = useState<string | undefined>(error);

    // Manejador para el envío del formulario de inicio de sesión
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            await onLogin(email.trim(), password);
        } catch {
            // El error se maneja a través de la prop error
        }
    };

    // Manejador para el envío del formulario de restablecimiento de contraseña
    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!resetEmail.trim()) {
            setFormError('Por favor, ingresa tu dirección de email');
            return;
        }

        try {
            if (onResetPassword) {
                await onResetPassword(resetEmail.trim());
                setResetDialogOpen(false);
                setResetEmail('');
            }
        } catch {
            // El error se maneja a través de la prop error
        }
    };

    // Manejador para el inicio de sesión con Google
    const handleGoogleLogin = async () => {
        if (onGoogleLogin) {
            try {
                await onGoogleLogin();
            } catch {
                // El error se maneja a través de la prop error
            }
        }
    };

    // Actualizar el error interno cuando cambia la prop error
    React.useEffect(() => {
        setFormError(error);
    }, [error]);

    return (
        <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md">
            <div className="text-center">
                <h1 className="text-3xl font-bold">Iniciar Sesión</h1>
                <p className="mt-2 text-muted-foreground">
                    Ingresa tus credenciales para acceder al dashboard
                </p>
            </div>

            {formError && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{formError}</AlertDescription>
                </Alert>
            )}

            <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                        id="email"
                        type="email"
                        placeholder="tu@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onBlur={(e) => setEmail(e.target.value.trim())}
                        disabled={isLoading}
                        required
                    />
                </div>

                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="password">Contraseña</Label>

                        {onResetPassword && (
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
                                            <Label htmlFor="reset-email">Email</Label>
                                            <Input
                                                id="reset-email"
                                                type="email"
                                                value={resetEmail}
                                                onChange={(e) => setResetEmail(e.target.value)}
                                                onBlur={(e) => setResetEmail(e.target.value.trim())}
                                                placeholder="tu@email.com"
                                                className="mt-1"
                                                required
                                            />
                                        </div>
                                        <DialogFooter>
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
                        )}
                    </div>
                    <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={isLoading}
                        required
                    />
                </div>

                <Button
                    type="submit"
                    className="w-full"
                    disabled={isLoading}
                >
                    {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                </Button>
            </form>

            {onGoogleLogin && (
                <>
                    <Separator className="my-6" />
                    <Button
                        type="button"
                        variant="outline"
                        className="w-full flex items-center justify-center bg-white hover:bg-gray-50"
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
                        <span>
                            {isGoogleLoading ? 'Conectando...' : 'Continuar con Google'}
                        </span>
                    </Button>
                </>
            )}

            {onRegisterClick && (
                <div className="text-center mt-4">
                    <p className="text-sm text-muted-foreground">
                        ¿No tienes una cuenta?{' '}
                        <button
                            type="button"
                            onClick={onRegisterClick}
                            className="text-primary hover:underline focus:outline-none"
                        >
                            Regístrate
                        </button>
                    </p>
                </div>
            )}
        </div>
    );
} 