import React, { useEffect } from 'react';
import { Label } from '@/components/atoms/Label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
} from '@/components/atoms/Select';
import { cn } from '@/lib/utils';

interface FilterItemProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    options: { value: string; label: string }[];
    mobileOptimized?: boolean;
    className?: string;
    disabled?: boolean;
}

export const FilterItem: React.FC<FilterItemProps> = ({
    label,
    value,
    onChange,
    options,
    mobileOptimized = false,
    className,
    disabled = false,
}) => {
    // Obtener la etiqueta seleccionada para mostrarla
    const selectedOption = options.find(option => option.value === value);
    const selectedLabel = selectedOption ? selectedOption.label : '';
    
    // Depuración para ver qué valores se están manejando
    useEffect(() => {
        console.log(`FilterItem [${label}] - Valor actual:`, value);
        console.log(`FilterItem [${label}] - Opción seleccionada:`, selectedOption);
        if (disabled) {
            console.log(`FilterItem [${label}] - Filtro deshabilitado`);
        }
    }, [value, selectedOption, label, disabled]);

    return (
        <div className={cn(className, 
            mobileOptimized ? "border rounded-md overflow-hidden" : ""
        )}>
            {mobileOptimized ? (
                // Versión optimizada para móvil
                <Select value={value} onValueChange={onChange} disabled={disabled}>
                    <SelectTrigger 
                        id={`filter-${label}`} 
                        className={cn(
                            "w-full border-0 rounded-none bg-card h-11 px-3 flex justify-between items-center",
                            disabled && "opacity-50 cursor-not-allowed"
                        )}
                    >
                        <div className="flex flex-col items-start">
                            <span className="text-xs text-muted-foreground">{label}</span>
                            <span className="text-sm font-medium">{selectedLabel}</span>
                        </div>
                    </SelectTrigger>
                    <SelectContent>
                        {options.map((option) => (
                            <SelectItem 
                                key={option.value} 
                                value={option.value}
                                className="text-sm"
                            >
                                {option.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            ) : (
                // Versión para desktop (mejorada para que muestre correctamente el valor seleccionado)
                <>
                    <Label htmlFor={`filter-${label}`} className="mb-1 block">
                        {label}
                    </Label>
                    <Select 
                        value={value} 
                        onValueChange={(newValue) => {
                            console.log(`FilterItem [${label}] - Nuevo valor seleccionado:`, newValue);
                            onChange(newValue);
                        }}
                        disabled={disabled}
                    >
                        <SelectTrigger id={`filter-${label}`} className="w-full">
                            {selectedLabel || `Seleccionar ${label}`}
                        </SelectTrigger>
                        <SelectContent>
                            {options.map((option) => (
                                <SelectItem 
                                    key={option.value} 
                                    value={option.value}
                                    className="text-sm"
                                >
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </>
            )}
        </div>
    );
}; 