import React, { ReactNode } from 'react';

interface LayoutTemplateProps {
    children: ReactNode;
}

/**
 * LayoutTemplate - Componente que proporciona la estructura básica de la página
 * @param {ReactNode} children - Contenido de la página
 * @returns JSX.Element
 */
export const LayoutTemplate: React.FC<LayoutTemplateProps> = ({ children }) => {
    return (
        <div className="min-h-screen bg-background flex flex-col">
            <main className="flex-1">
                {children}
            </main>
        </div>
    );
}; 