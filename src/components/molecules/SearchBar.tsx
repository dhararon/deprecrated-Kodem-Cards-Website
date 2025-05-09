import React, { useState, useCallback } from 'react';
import { Input } from '@/components/atoms/Input';
import { Button } from '@/components/atoms/Button';
import { Badge } from '@/components/atoms/Badge';
import { motion } from 'framer-motion';
import { MagnifyingGlassIcon, XMarkIcon, FunnelIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

export interface SearchFilter {
    id: string;
    label: string;
    value: string;
}

export interface SearchBarProps {
    onSearch: (searchText: string) => void;
    onFilterChange?: (filters: SearchFilter[]) => void;
    placeholder?: string;
    className?: string;
    initialFilters?: SearchFilter[];
    debounceTime?: number;
    showFilterButton?: boolean;
}

/**
 * SearchBar - Un componente de barra de búsqueda con opción para filtros
 */
export function SearchBar({
    onSearch,
    onFilterChange,
    placeholder = 'Buscar...',
    className,
    initialFilters = [],
    debounceTime = 300,
    showFilterButton = false
}: SearchBarProps) {
    const [searchText, setSearchText] = useState('');
    const [filters, setFilters] = useState<SearchFilter[]>(initialFilters);
    const [showFilters, setShowFilters] = useState(false);

    // Función debounce para la búsqueda como función inline
    const debouncedSearch = useCallback((value: string) => {
        const handler = setTimeout(() => {
            onSearch(value);
        }, debounceTime);
        
        return () => {
            clearTimeout(handler);
        };
    }, [onSearch, debounceTime]);

    // Manejar cambio en el input
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchText(value);
        debouncedSearch(value);
    };

    // Manejar el clic en el botón de buscar
    const handleSearchClick = () => {
        onSearch(searchText);
    };

    // Manejar la eliminación de un filtro
    const handleRemoveFilter = (filterId: string) => {
        const updatedFilters = filters.filter((filter) => filter.id !== filterId);
        setFilters(updatedFilters);
        if (onFilterChange) {
            onFilterChange(updatedFilters);
        }
    };

    // Manejar la tecla Enter
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            onSearch(searchText);
        }
    };

    return (
        <div className={cn("w-full space-y-2", className)}>
            <div className="flex gap-2">
                <div className="relative flex-grow">
                    <Input
                        className="w-full pl-10"
                        placeholder={placeholder}
                        value={searchText}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                    />
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    {searchText && (
                        <button
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            onClick={() => {
                                setSearchText('');
                                onSearch('');
                            }}
                        >
                            <XMarkIcon className="h-5 w-5" />
                        </button>
                    )}
                </div>
                <Button onClick={handleSearchClick}>
                    Buscar
                </Button>
                {showFilterButton && (
                    <Button
                        variant="outline"
                        onClick={() => setShowFilters(!showFilters)}
                    >
                        <FunnelIcon className="h-5 w-5" />
                        <span className="sr-only">Filtros</span>
                    </Button>
                )}
            </div>

            {/* Sección de filtros */}
            {filters.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="flex flex-wrap gap-2 pt-2"
                >
                    {filters.map((filter) => (
                        <Badge key={filter.id} variant="secondary" className="pl-2 pr-1 py-1 flex items-center gap-1">
                            <span>{filter.label}: {filter.value}</span>
                            <button
                                onClick={() => handleRemoveFilter(filter.id)}
                                className="rounded-full hover:bg-gray-200 p-1"
                            >
                                <XMarkIcon className="h-3 w-3" />
                            </button>
                        </Badge>
                    ))}
                    {filters.length > 0 && (
                        <Button
                            variant="ghost"
                            className="h-6 text-xs"
                            onClick={() => {
                                setFilters([]);
                                if (onFilterChange) {
                                    onFilterChange([]);
                                }
                            }}
                        >
                            Limpiar filtros
                        </Button>
                    )}
                </motion.div>
            )}
        </div>
    );
} 