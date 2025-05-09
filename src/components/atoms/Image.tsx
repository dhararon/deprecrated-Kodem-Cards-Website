import React from 'react';
import NextImage, { ImageProps as NextImageProps } from 'next/image';

export interface ImageProps extends Omit<NextImageProps, 'loader'> {
  src: string;
}

/**
 * Componente Image personalizado que envuelve el componente Next.js Image
 * y proporciona un loader personalizado para soportar imágenes de Firebase Storage.
 */
export function Image({ src, ...props }: ImageProps) {
  // Si la URL es de Firebase Storage, usamos img nativa en su lugar
  if (src && typeof src === 'string' && src.includes('firebasestorage.googleapis.com')) {
    // Extraer solo las propiedades seguras que puede recibir una etiqueta img
    const { 
      alt, 
      className, 
      style, 
      width, 
      height, 
      onLoad, 
      onError,
      id,
      loading = 'lazy'
    } = props;

    return (
      <img
        src={src}
        alt={alt}
        className={className}
        style={{
          ...style,
          objectFit: (props.objectFit || 'cover') as 'cover' | 'contain' | 'fill' | 'none' | 'scale-down',
          objectPosition: props.objectPosition,
        }}
        width={width}
        height={height}
        onLoad={onLoad}
        onError={onError}
        id={id}
        loading={loading}
      />
    );
  }

  // Para otras imágenes, usamos el componente Next.js Image original
  return <NextImage src={src} {...props} />;
}

export default Image; 