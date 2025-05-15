import React, { useState } from 'react';
import { CardGallery } from '../CardGallery';
import { Card } from '../atoms/Card';
import { CardWithBadge } from '../molecules/CardWithBadge';

interface CardItem {
    id: string;
    title: string;
    description?: string;
    imageUrl: string;
    tag?: {
        text: string;
        variant?: 'default' | 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';
    };
}

interface CardListProps {
    cards: CardItem[];
    itemsPerPage?: number;
    onCardClick?: (id: string) => void;
    showFilters?: boolean;
}

/**
 * Componente organismo que implementa un listado de tarjetas con paginación y filtrado
 * @param cards Array de objetos con la información de las tarjetas
 * @param itemsPerPage Número de tarjetas por página
 * @param onCardClick Función a ejecutar al hacer clic en una tarjeta
 * @param showFilters Indica si se deben mostrar los filtros
 */
export const CardList: React.FC<CardListProps> = ({
    cards,
    itemsPerPage = 8,
    onCardClick,
    showFilters = false,
}) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');

    // Filtrar tarjetas por término de búsqueda
    const filteredCards = cards.filter(card => 
        card.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (card.description && card.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // Calcular total de páginas
    const totalPages = Math.ceil(filteredCards.length / itemsPerPage);
    
    // Obtener tarjetas para la página actual
    const currentCards = filteredCards.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // Cambiar de página
    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    return (
        <div className="space-y-6">
            {showFilters && (
                <div className="mb-4">
                    <input
                        type="text"
                        placeholder="Buscar tarjetas..."
                        className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            )}

            <CardGallery>
                {currentCards.map((card) => (
                    card.tag ? (
                        <CardWithBadge
                            key={card.id}
                            title={card.title}
                            description={card.description}
                            imageUrl={card.imageUrl}
                            badgeText={card.tag.text}
                            badgeVariant={card.tag.variant}
                            onClick={() => onCardClick && onCardClick(card.id)}
                        />
                    ) : (
                        <Card
                            key={card.id}
                            title={card.title}
                            description={card.description}
                            imageUrl={card.imageUrl}
                            onClick={() => onCardClick && onCardClick(card.id)}
                        />
                    )
                ))}
            </CardGallery>

            {totalPages > 1 && (
                <div className="flex justify-center mt-6">
                    <nav className="inline-flex rounded-md shadow">
                        <button
                            onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                            disabled={currentPage === 1}
                            className="px-3 py-1 rounded-l-md border border-r-0 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Anterior
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                            <button
                                key={page}
                                onClick={() => handlePageChange(page)}
                                className={`px-3 py-1 border text-sm font-medium ${
                                    currentPage === page
                                        ? 'bg-primary text-white border-primary'
                                        : 'bg-white text-gray-500 hover:bg-gray-50'
                                }`}
                            >
                                {page}
                            </button>
                        ))}
                        <button
                            onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                            disabled={currentPage === totalPages}
                            className="px-3 py-1 rounded-r-md border border-l-0 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Siguiente
                        </button>
                    </nav>
                </div>
            )}
        </div>
    );
}; 