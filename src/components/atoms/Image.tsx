import React from 'react';

export interface ImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  objectPosition?: string;
}

/**
 * Componente Image personalizado que proporciona funcionalidades similares
 * a la de Next.js Image pero utilizando la etiqueta img nativa.
 */
export function Image({ 
  src, 
  objectFit = 'cover', 
  objectPosition,
  style,
  ...props 
}: ImageProps) {
  return (
    <img
      src={src}
      style={{
        ...style,
        objectFit,
        objectPosition,
      }}
      loading="lazy"
      {...props}
    />
  );
}

export default Image; 