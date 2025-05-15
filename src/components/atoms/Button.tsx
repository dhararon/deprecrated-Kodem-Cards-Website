import React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    fullWidth?: boolean;
    isLoading?: boolean;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    children: React.ReactNode;
}

/**
 * Componente Button reutilizable con diferentes variantes y tamaños
 * @param variant Estilo visual del botón
 * @param size Tamaño del botón
 * @param fullWidth Si el botón debe ocupar todo el ancho disponible
 * @param isLoading Estado de carga del botón
 * @param leftIcon Icono a mostrar a la izquierda del texto
 * @param rightIcon Icono a mostrar a la derecha del texto
 * @param children Contenido del botón
 * @param ...props Demás propiedades del botón
 */
export const Button: React.FC<ButtonProps> = ({
    variant = 'primary',
    size = 'md',
    fullWidth = false,
    isLoading = false,
    leftIcon,
    rightIcon,
    children,
    className = '',
    disabled,
    ...props
}) => {
    // Mapeo de variantes a clases de Tailwind
    const variantClasses = {
        primary: 'bg-primary text-white hover:bg-primary/90',
        secondary: 'bg-secondary text-white hover:bg-secondary/80',
        outline: 'border border-input bg-background hover:bg-accent text-primary hover:text-primary',
        ghost: 'hover:bg-accent text-primary hover:text-primary',
        danger: 'bg-destructive text-white hover:bg-destructive/90',
    };

    // Mapeo de tamaños a clases de Tailwind
    const sizeClasses = {
        sm: 'h-8 px-3 text-xs',
        md: 'h-10 px-4 py-2',
        lg: 'h-12 px-6 py-3 text-lg',
    };

    // Combinación de clases
    const buttonClasses = `
        inline-flex items-center justify-center rounded-md font-medium transition-colors
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
        disabled:opacity-50 disabled:pointer-events-none
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
    `;

    return (
        <button
            className={buttonClasses}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading && (
                <svg 
                    className="animate-spin -ml-1 mr-2 h-4 w-4" 
                    xmlns="http://www.w3.org/2000/svg" 
                    fill="none" 
                    viewBox="0 0 24 24"
                >
                    <circle 
                        className="opacity-25" 
                        cx="12" 
                        cy="12" 
                        r="10" 
                        stroke="currentColor" 
                        strokeWidth="4"
                    ></circle>
                    <path 
                        className="opacity-75" 
                        fill="currentColor" 
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                </svg>
            )}
            
            {leftIcon && !isLoading && (
                <span className="mr-2">{leftIcon}</span>
            )}
            
            {children}
            
            {rightIcon && (
                <span className="ml-2">{rightIcon}</span>
            )}
        </button>
    );
};
