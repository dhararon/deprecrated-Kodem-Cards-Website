import React, { useState, useEffect, memo } from 'react';
import { Skeleton } from '@/components/atoms/Skeleton';
import { cn } from '@/lib/utils';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    src: string;
    alt: string;
    fallbackSrc?: string;
    width?: number;
    height?: number;
    className?: string;
    skeletonClassName?: string;
    eager?: boolean; // Cargar inmediatamente sin lazy loading
}

/**
 * OptimizedImage - Componente para mostrar imágenes optimizadas con lazy loading,
 * fallbacks, y placeholders durante la carga
 */
const OptimizedImage = ({
    src,
    alt,
    fallbackSrc = '/placeholder-image.png',
    width,
    height,
    className,
    skeletonClassName,
    eager = false,
    ...props
}: OptimizedImageProps) => {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(false);
    const [currentSrc, setCurrentSrc] = useState(src);

    // Reiniciar estado cuando cambia la URL fuente
    useEffect(() => {
        setIsLoading(true);
        setError(false);
        setCurrentSrc(src);
    }, [src]);

    // Convertir a WebP si es posible
    const getWebPUrl = (url: string): string => {
        // Solo convertir si no es una URL de WebP ya
        if (url.includes('.webp')) return url;

        // Si es una URL de Cloudinary, podemos pedir formato WebP
        if (url.includes('cloudinary.com') && !url.includes('/f_webp/')) {
            return url.replace(/\/upload\//, '/upload/f_webp/');
        }

        // Si es un archivo local, buscar versión webp
        if (url.match(/\.(jpe?g|png)$/i)) {
            return url.replace(/\.(jpe?g|png)$/i, '.webp');
        }

        return url;
    };

    // Intentar usar WebP si es compatible
    const webpUrl = getWebPUrl(currentSrc);

    const handleImageLoad = () => {
        setIsLoading(false);
    };

    const handleImageError = () => {
        setIsLoading(false);

        // Si falla con WebP, intentar con la URL original
        if (webpUrl !== currentSrc) {
            setCurrentSrc(src);
            return;
        }

        // Si falla la URL original, usar el fallback
        if (currentSrc !== fallbackSrc) {
            setError(true);
            setCurrentSrc(fallbackSrc);
        }
    };

    return (
        <div className={cn("relative", className)} style={{ width, height }}>
            {isLoading && (
                <Skeleton className={cn("absolute inset-0 z-10", skeletonClassName)} />
            )}

            <picture>
                {/* Formatos modernos para navegadores compatibles */}
                <source srcSet={webpUrl} type="image/webp" />

                <img
                    src={currentSrc}
                    alt={alt}
                    className={cn(
                        "transition-opacity duration-300 w-full h-full object-cover",
                        isLoading ? "opacity-0" : "opacity-100",
                        error ? "grayscale opacity-70" : ""
                    )}
                    loading={eager ? "eager" : "lazy"}
                    onLoad={handleImageLoad}
                    onError={handleImageError}
                    width={width}
                    height={height}
                    {...props}
                />
            </picture>
        </div>
    );
};

export default memo(OptimizedImage); 