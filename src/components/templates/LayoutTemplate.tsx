import React, { ReactNode } from 'react';
import Topbar from '@/components/organisms/Sidebar';

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
            <Topbar />
            <main className="flex-1 pt-16">
                {children}
            </main>
        </div>
    );
}; 