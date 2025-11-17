import { useMemo } from 'react';

type CardSizeConfig = {
  width: number;
  height: number;
  scale: number;
};

/**
 * Hook para obtener dimensiones responsivas de cartas basadas en el viewport
 * @returns Objeto con width, height y scale adaptados al tamaño de pantalla
 */
export const useResponsiveCardSize = (): CardSizeConfig => {
  return useMemo(() => {
    // Verificar que estamos en el cliente
    if (typeof window === 'undefined') {
      return { width: 157, height: 220, scale: 1 };
    }

    const width = window.innerWidth;

    // Mobile (< 768px): Reducir 40%
    if (width < 768) {
      return {
        width: 94,   // 60% de 157px
        height: 132, // 60% de 220px
        scale: 0.6,
      };
    }

    // Tablet (768px - 1024px): Reducir 15%
    if (width < 1024) {
      return {
        width: 133,  // 85% de 157px
        height: 187, // 85% de 220px
        scale: 0.85,
      };
    }

    // Desktop (> 1024px): Tamaño completo
    return {
      width: 157,
      height: 220,
      scale: 1,
    };
  }, []);
};

export default useResponsiveCardSize;
