import React from 'react';
import { CardGalleryPage } from '../components/templates/CardGalleryPage';

/**
 * Página de demostración de la galería de tarjetas
 */
export const GalleryDemo: React.FC = () => {
    // Datos de ejemplo para la demostración
    const demoCards = [
        {
            id: '1',
            title: 'Card 1',
            description: 'Descripción de la primera tarjeta con información relevante.',
            imageUrl: 'https://source.unsplash.com/random/800x600?programming',
            tag: {
                text: 'Nuevo',
                variant: 'success' as const
            }
        },
        {
            id: '2',
            title: 'Card 2',
            description: 'Ejemplo de tarjeta con contenido técnico.',
            imageUrl: 'https://source.unsplash.com/random/800x600?code',
            tag: {
                text: 'Popular',
                variant: 'primary' as const
            }
        },
        {
            id: '3',
            title: 'Card 3',
            description: 'Tarjeta con información sobre desarrollo frontend.',
            imageUrl: 'https://source.unsplash.com/random/800x600?website',
        },
        {
            id: '4',
            title: 'Card 4',
            description: 'Información sobre tecnologías web modernas.',
            imageUrl: 'https://source.unsplash.com/random/800x600?technology',
            tag: {
                text: 'Avanzado',
                variant: 'warning' as const
            }
        },
        {
            id: '5',
            title: 'Card 5',
            description: 'Ejemplo de tarjeta con tema de diseño.',
            imageUrl: 'https://source.unsplash.com/random/800x600?design',
        },
        {
            id: '6',
            title: 'Card 6',
            description: 'Contenido sobre arquitectura de software.',
            imageUrl: 'https://source.unsplash.com/random/800x600?architecture',
            tag: {
                text: 'Especial',
                variant: 'info' as const
            }
        },
        {
            id: '7',
            title: 'Card 7',
            description: 'Detalles sobre componentes React.',
            imageUrl: 'https://source.unsplash.com/random/800x600?react',
        },
        {
            id: '8',
            title: 'Card 8',
            description: 'Información sobre estilos con Tailwind CSS.',
            imageUrl: 'https://source.unsplash.com/random/800x600?css',
            tag: {
                text: 'Destacado',
                variant: 'secondary' as const
            }
        },
        {
            id: '9',
            title: 'Card 9',
            description: 'Ejemplos de patrones de diseño en frontend.',
            imageUrl: 'https://source.unsplash.com/random/800x600?patterns',
        },
        {
            id: '10',
            title: 'Card 10',
            description: 'Guía de buenas prácticas en desarrollo web.',
            imageUrl: 'https://source.unsplash.com/random/800x600?development',
            tag: {
                text: 'Recomendado',
                variant: 'primary' as const
            }
        },
    ];

    // Función de ejemplo para manejar clics en tarjetas
    const handleCardClick = (id: string) => {
        console.log(`Tarjeta con ID ${id} clickeada`);
        alert(`Has seleccionado la tarjeta: ${id}`);
    };

    return (
        <CardGalleryPage
            title="Galería de Tarjetas"
            description="Ejemplo de galería de tarjetas con paginación y filtrado utilizando el sistema de componentes basado en Atomic Design."
            cards={demoCards}
            onCardClick={handleCardClick}
            showFilters={true}
            itemsPerPage={6}
        />
    );
}; 