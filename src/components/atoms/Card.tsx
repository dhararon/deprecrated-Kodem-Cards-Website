import React, { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
    children?: ReactNode;
    className?: string;
}

export function Card({ children, className, ...props }: CardProps) {
    return (
        <div className={cn("bg-card rounded-lg shadow-md overflow-hidden", className)} {...props}>
            {children}
        </div>
    );
}

interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
    children?: ReactNode;
    className?: string;
}

export function CardHeader({ children, className, ...props }: CardHeaderProps) {
    return (
        <div className={cn("p-4 flex flex-col space-y-1.5", className)} {...props}>
            {children}
        </div>
    );
}

interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {
    children?: ReactNode;
    className?: string;
}

export function CardTitle({ children, className, ...props }: CardTitleProps) {
    return (
        <h3 className={cn("font-semibold text-lg text-card-foreground", className)} {...props}>
            {children}
        </h3>
    );
}

interface CardDescriptionProps extends HTMLAttributes<HTMLParagraphElement> {
    children?: ReactNode;
    className?: string;
}

export function CardDescription({ children, className, ...props }: CardDescriptionProps) {
    return (
        <p className={cn("text-muted-foreground text-sm", className)} {...props}>
            {children}
        </p>
    );
}

interface CardContentProps extends HTMLAttributes<HTMLDivElement> {
    children?: ReactNode;
    className?: string;
}

export function CardContent({ children, className, ...props }: CardContentProps) {
    return (
        <div className={cn("p-4", className)} {...props}>
            {children}
        </div>
    );
}

interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {
    children?: ReactNode;
    className?: string;
}

export function CardFooter({ children, className, ...props }: CardFooterProps) {
    return (
        <div className={cn("flex items-center p-4 pt-0", className)} {...props}>
            {children}
        </div>
    );
}

// Mantener la CardOriginal por si se usa en algún lado
interface CardOriginalProps {
    title: string;
    description?: string;
    imageUrl: string;
    onClick?: () => void;
    className?: string;
}

export const CardOriginal: React.FC<CardOriginalProps> = ({
    title,
    description,
    imageUrl,
    onClick,
    className = '',
}) => {
    return (
        <div 
            className={`bg-card rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 ${className}`}
            onClick={onClick}
            role={onClick ? "button" : undefined}
            tabIndex={onClick ? 0 : undefined}
        >
            <div className="relative h-48 overflow-hidden">
                <img
                    src={imageUrl}
                    alt={title}
                    className="w-full h-full object-cover"
                />
            </div>
            <div className="p-4">
                <h3 className="font-semibold text-lg text-card-foreground mb-1">{title}</h3>
                {description && (
                    <p className="text-muted-foreground text-sm">{description}</p>
                )}
            </div>
        </div>
    );
};
