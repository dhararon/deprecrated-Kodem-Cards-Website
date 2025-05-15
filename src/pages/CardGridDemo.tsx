import React from 'react';
import { CardGrid } from '../components/organisms/CardGrid';

// Tipo para las variantes de los badges
type BadgeVariant = 'default' | 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';

/**
 * Página de demostración para el componente CardGrid
 */
export const CardGridDemo: React.FC = () => {
    // Manejadores de eventos para las tarjetas
    const handleCardClick = (id: string) => {
        alert(`Tarjeta simple ${id} clickeada`);
    };
    
    const handlePrimaryAction = (id: string) => {
        alert(`Acción primaria en tarjeta ${id}`);
    };
    
    const handleSecondaryAction = (id: string) => {
        alert(`Acción secundaria en tarjeta ${id}`);
    };

    // Datos de ejemplo para la demostración de tipos de tarjetas
    const cards = [
        // Tarjetas simples
        {
            id: 'simple-1',
            type: 'simple' as const,
            title: 'Tarjeta Simple 1',
            description: 'Ejemplo de tarjeta simple con acción al hacer clic.',
            imageUrl: 'https://source.unsplash.com/random/800x600?tech',
            onClick: handleCardClick
        },
        {
            id: 'simple-2',
            type: 'simple' as const,
            title: 'Tarjeta Simple 2',
            description: 'Otra tarjeta simple con solo imagen y texto.',
            imageUrl: 'https://source.unsplash.com/random/800x600?code'
        },
        
        // Tarjetas con etiquetas
        {
            id: 'tagged-1',
            type: 'tag' as const,
            title: 'Tarjeta con Etiqueta',
            description: 'Ejemplo de tarjeta con etiqueta destacada.',
            imageUrl: 'https://source.unsplash.com/random/800x600?design',
            tag: {
                text: 'Nuevo',
                variant: 'success' as BadgeVariant
            }
        },
        {
            id: 'tagged-2',
            type: 'tag' as const,
            title: 'Otra Etiquetada',
            description: 'Tarjeta con etiqueta de advertencia.',
            imageUrl: 'https://source.unsplash.com/random/800x600?programming',
            tag: {
                text: 'Popular',
                variant: 'warning' as BadgeVariant
            }
        },
        
        // Tarjetas con acciones
        {
            id: 'action-1',
            type: 'action' as const,
            title: 'Tarjeta con Acciones',
            description: 'Ejemplo de tarjeta con botones de acción primaria y secundaria.',
            imageUrl: 'https://source.unsplash.com/random/800x600?app',
            actions: {
                primary: {
                    label: 'Ver más',
                    onClick: handlePrimaryAction,
                    variant: 'primary' as const
                },
                secondary: {
                    label: 'Cancelar',
                    onClick: handleSecondaryAction,
                    variant: 'outline' as const
                }
            }
        },
        {
            id: 'action-2',
            type: 'action' as const,
            title: 'Solo Acción Primaria',
            description: 'Tarjeta que solo muestra un botón de acción principal.',
            imageUrl: 'https://source.unsplash.com/random/800x600?website',
            actions: {
                primary: {
                    label: 'Explorar',
                    onClick: handlePrimaryAction,
                    variant: 'primary' as const
                }
            }
        }
    ];

    return (
        <div className="container mx-auto p-6">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Demostración de CardGrid</h1>
                <p className="text-muted-foreground">
                    Este ejemplo muestra diferentes tipos de tarjetas usando el componente CardGrid.
                </p>
            </div>
            
            <div className="mb-12">
                <h2 className="text-xl font-semibold mb-4">Configuración por defecto</h2>
                <CardGrid cards={cards} />
            </div>
            
            <div className="mb-12">
                <h2 className="text-xl font-semibold mb-4">Columnas personalizadas</h2>
                <CardGrid 
                    cards={cards} 
                    columns={{
                        sm: 1,
                        md: 2,
                        lg: 2,
                        xl: 3
                    }}
                />
            </div>
            
            <div className="mb-12">
                <h2 className="text-xl font-semibold mb-4">Espaciado grande entre tarjetas</h2>
                <CardGrid cards={cards} gap="lg" />
            </div>
        </div>
    );
}; 