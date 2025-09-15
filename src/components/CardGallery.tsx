import React from 'react';

interface CardGalleryProps {
    children: React.ReactNode;
}

export const CardGallery: React.FC<CardGalleryProps> = ({ children }) => {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
            {children}
        </div>
    );
};
