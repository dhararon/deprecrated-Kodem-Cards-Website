import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';
import { Label } from '@/components/atoms/Label';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/atoms/Card';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Esquema de validación
const formSchema = z.object({
    name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
    email: z.string()
        .trim() // Eliminar espacios en blanco
        .email('Email inválido'),
    password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
    confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword']
});

export type RegisterFormValues = z.infer<typeof formSchema>;

export interface RegisterFormProps {
    /**
     * Callback cuando se envía el formulario de registro
     */
    onRegister: (data: Omit<RegisterFormValues, 'confirmPassword'>) => Promise<void>;

    /**
     * Callback para navegar a la página de inicio de sesión
     */
    onLoginClick?: () => void;

    /**
     * Mensaje de error global (no asociado a un campo específico)
     */
    error?: string;

    /**
     * Indica si el formulario está en proceso de envío
     */
    isLoading?: boolean;
}

/**
 * RegisterForm - Formulario de registro con validación y manejo de errores
 */
export function RegisterForm({
    onRegister,
    onLoginClick,
    error,
    isLoading = false
}: RegisterFormProps) {
    const {
        register,
        handleSubmit,
        formState: { errors }
    } = useForm<RegisterFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: '',
            email: '',
            password: '',
            confirmPassword: ''
        }
    });

    // Manejador para el envío del formulario
    const onSubmit = async (data: RegisterFormValues) => {
        const { confirmPassword: _confirmPassword, ...registerData } = data;
        // Validación adicional (esto usa _confirmPassword)
        if (registerData.password !== _confirmPassword) {
            return; // No continuar si las contraseñas no coinciden
        }
        
        try {
            await onRegister(registerData);
        } catch {
            // El error se maneja a través de la prop error
        }
    };

    return (
        <Card className="w-full max-w-md">
            <CardHeader className="space-y-1">
                <CardTitle className="text-2xl font-bold text-center">Crear Cuenta</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
                {error && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Nombre completo</Label>
                        <Input
                            id="name"
                            type="text"
                            {...register('name')}
                            placeholder="Tu nombre"
                            disabled={isLoading}
                        />
                        {errors.name && (
                            <p className="text-sm text-destructive">{errors.name.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            {...register('email')}
                            placeholder="ejemplo@correo.com"
                            disabled={isLoading}
                        />
                        {errors.email && (
                            <p className="text-sm text-destructive">{errors.email.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password">Contraseña</Label>
                        <Input
                            id="password"
                            type="password"
                            {...register('password')}
                            placeholder="******"
                            disabled={isLoading}
                        />
                        {errors.password && (
                            <p className="text-sm text-destructive">{errors.password.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
                        <Input
                            id="confirmPassword"
                            type="password"
                            {...register('confirmPassword')}
                            placeholder="******"
                            disabled={isLoading}
                        />
                        {errors.confirmPassword && (
                            <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
                        )}
                    </div>

                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? 'Creando cuenta...' : 'Registrarse'}
                    </Button>
                </form>
            </CardContent>

            {onLoginClick && (
                <CardFooter className="flex justify-center">
                    <Button variant="outline" onClick={onLoginClick} disabled={isLoading}>
                        ¿Ya tienes cuenta? Inicia sesión
                    </Button>
                </CardFooter>
            )}
        </Card>
    );
} 