import React, { ChangeEvent, KeyboardEvent } from 'react';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { Input } from '@/components/atoms/Input';
import { Button } from '@/components/atoms/Button';
import { Spinner } from '@/components/atoms/Spinner';

interface SearchInputProps {
    value: string;
    onChange: (value: string) => void;
    onSearch?: (value: string) => void;
    placeholder?: string;
    loading?: boolean;
    className?: string;
}

export const SearchInput = ({
    value,
    onChange,
    onSearch,
    placeholder = 'Buscar...',
    loading = false,
    className = '',
}: SearchInputProps) => {
    const handleFocus = () => { /* Intencionalmente vacía */ };
    const handleBlur = () => { /* Intencionalmente vacía */ };

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        onChange(e.target.value);
    };

    const handleClear = () => {
        onChange('');
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && onSearch) {
            onSearch(value);
        }
    };

    const handleSearchClick = () => {
        if (onSearch) {
            onSearch(value);
        }
    };

    return (
        <div className={`relative flex w-full items-center ${className}`}>
            <div className="relative w-full">
                <Input
                    type="text"
                    className="w-full pr-10 pl-10"
                    placeholder={placeholder}
                    value={value}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                />
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                {value && (
                    <button
                        type="button"
                        className="absolute inset-y-0 right-0 flex items-center pr-3"
                        onClick={handleClear}
                    >
                        <XMarkIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    </button>
                )}
            </div>
            {onSearch && (
                <Button
                    type="button"
                    variant="primary"
                    className="ml-2 min-w-[80px]"
                    onClick={handleSearchClick}
                    disabled={loading}
                >
                    {loading ? <Spinner size="sm" /> : 'Buscar'}
                </Button>
            )}
        </div>
    );
}; 