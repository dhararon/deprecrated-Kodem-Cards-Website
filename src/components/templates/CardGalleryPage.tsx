import React from 'react';
import { CardList } from '../organisms/CardList';

interface CardGalleryPageProps {
    title: string;
    description?: string;
    cards: Array<{
        id: string;
        title: string;
        description?: string;
        imageUrl: string;
        tag?: {
            text: string;
            variant?: 'default' | 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';
        };
    }>;
    onCardClick?: (id: string) => void;
    showFilters?: boolean;
    itemsPerPage?: number;
}

/**
 * Plantilla para páginas de galerías de tarjetas
 * @param title Título de la página
 * @param description Descripción opcional de la página
 * @param cards Array de objetos con la información de las tarjetas
 * @param onCardClick Función a ejecutar al hacer clic en una tarjeta
 * @param showFilters Indica si se deben mostrar los filtros
 * @param itemsPerPage Número de tarjetas por página
 */
export const CardGalleryPage: React.FC<CardGalleryPageProps> = ({
    title,
    description,
    cards,
    onCardClick,
    showFilters = true,
    itemsPerPage = 8,
}) => {
    return (
        <div className="container mx-auto px-4 py-8">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-foreground mb-2">{title}</h1>
                {description && (
                    <p className="text-muted-foreground">{description}</p>
                )}
            </header>

            <main>
                <CardList
                    cards={cards}
                    onCardClick={onCardClick}
                    showFilters={showFilters}
                    itemsPerPage={itemsPerPage}
                />
            </main>
        </div>
    );
}; 