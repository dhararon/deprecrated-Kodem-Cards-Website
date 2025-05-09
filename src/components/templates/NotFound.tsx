import React from 'react';
import { useLocation } from 'wouter';
import { LayoutTemplate } from './LayoutTemplate';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/atoms/Card';
import { Button } from '@/components/atoms/Button';
import { useAuth } from '@/hooks/useAuth';

/**
 * NotFound - Componente que se muestra cuando una ruta no existe
 * @returns JSX.Element
 */
export const NotFound: React.FC = () => {
    const { isAuthenticated } = useAuth();
    const [, navigate] = useLocation();

    const goBack = () => {
        window.history.back();
    };

    const goHome = () => {
        navigate(isAuthenticated ? '/collection' : '/');
    };

    return (
        <LayoutTemplate>
            <div className="flex items-center justify-center min-h-[calc(100vh-200px)] p-4">
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center pb-2">
                        <h1 className="text-6xl font-bold text-primary mb-2">404</h1>
                        <p className="text-2xl font-bold">Página no encontrada</p>
                    </CardHeader>
                    <CardContent className="text-center pb-2">
                        <p className="text-muted-foreground">
                            Lo sentimos, la página que estás buscando no existe o ha sido movida.
                        </p>
                    </CardContent>
                    <CardFooter className="flex justify-center gap-4">
                        <Button variant="outline" onClick={goBack}>
                            Volver atrás
                        </Button>
                        <Button onClick={goHome}>
                            Ir al inicio
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </LayoutTemplate>
    );
} 