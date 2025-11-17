# Nuevo Componente: CollectionGridMobileFirst

## Overview
Se ha creado un nuevo componente `CollectionGridMobileFirst` que proporciona una experiencia de usuario optimizada para mobile-first en la administración de cartas de colección.

## Ubicación
```
src/components/organisms/CollectionGridMobileFirst.tsx
```

## Características principales

### 1. **Layout Mobile-First**
- Diseño responsivo que prioriza la experiencia móvil
- Adaptable a todos los tamaños de pantalla
- Optimizado para touch en dispositivos móviles

### 2. **Secciones Colapsables por Rareza**
- Cada rareza (Especial, Épica, Rara, Poco Común, Común, Custom) es una sección colapsable
- Reduce el desorden visual al cargar la página
- Permite expandir/contraer todas las secciones con un botón

### 3. **Estadísticas en Dashboard**
- **Total cartas**: Número total de cartas en el set/colección
- **Coleccionadas**: Cuántas cartas tienes en tu colección
- **Completitud**: Porcentaje de colección completa

### 4. **Barra de Progreso Visual**
- Visualización clara del progreso de completitud
- Se actualiza en tiempo real

### 5. **Lista de Cartas Mejorada**
Cada carta muestra:
- **Miniatura**: Imagen pequeña de la carta
- **Nombre**: Nombre de la carta con truncamiento
- **Información**: Número de carta y tipo
- **Control de cantidad**: Selector para agregar/quitar cantidad
- Clickeable para ver más detalles en modal

### 6. **Modal de Detalles**
Muestra información completa de la carta:
- Imagen grande
- ID de la carta
- Tipo y energía
- Control de cantidad
- Diseño responsive

## Cómo usar

### Opción 1: Reemplazar el componente actual (si deseas usar solo mobile-first)

En `src/pages/collections/index.tsx`:

```tsx
import CollectionGridMobileFirst from '@/components/organisms/CollectionGridMobileFirst';

// En lugar de CollectionGrid, usa:
<CollectionGridMobileFirst
    cards={cardsToDisplay}
    cardsByRarity={cardsByRarityGrouping}
    updateCardQuantity={handleQuantityUpdate}
    updatingCardId={updating}
/>
```

### Opción 2: Usar condicionalmente (Recomendado)

```tsx
import { useState, useEffect } from 'react';
import CollectionGrid from '@/components/organisms/CollectionGrid';
import CollectionGridMobileFirst from '@/components/organisms/CollectionGridMobileFirst';

export default function Collection() {
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return isMobile ? (
        <CollectionGridMobileFirst
            cards={cardsToDisplay}
            cardsByRarity={cardsByRarityGrouping}
            updateCardQuantity={handleQuantityUpdate}
            updatingCardId={updating}
        />
    ) : (
        <CollectionGrid
            cards={cardsToDisplay}
            cardsByRarity={cardsByRarityGrouping}
            updateCardQuantity={handleQuantityUpdate}
            updatingCardId={updating}
        />
    );
}
```

## Props

```typescript
interface CollectionGridMobileFirstProps {
    cards: CardWithQuantity[];           // Array de cartas con cantidad
    cardsByRarity: Record<string, CardWithQuantity[]>; // Cartas agrupadas por rareza
    updateCardQuantity: (cardId: string, quantity: number) => void; // Callback para actualizar cantidad
    updatingCardId: string | null;       // ID de la carta siendo actualizada (para mostrar loading)
    className?: string;                   // Clases CSS adicionales
}
```

## Ventajas

✅ **Mobile-First**: Diseñado priorizando experiencia móvil  
✅ **Responsive**: Funciona perfectamente en todos los dispositivos  
✅ **Performance**: Usa `memo` para optimizar re-renders  
✅ **UX**: Interfaz clara e intuitiva  
✅ **Accesibilidad**: Estructura semántica y controles accesibles  
✅ **Expandible**: Fácil agregar más características  

## Comparación con CollectionGrid

| Característica | CollectionGrid | CollectionGridMobileFirst |
|---|---|---|
| Optimización | Desktop-first | Mobile-first |
| Vista predeterminada | Todas expandidas | Todas colapsadas |
| Cargas progresivas | Sí (50 cartas) | No (carga todas) |
| Preview en hover | Sí | No (modal en click) |
| Navegación entre cartas | Sí (flechas) | No (modal simple) |
| Mejor en mobile | Regular | Excelente |
| Mejor en desktop | Excelente | Regular |

## Estructura de la Rareza

Las rarezas se muestran en orden:
1. Especial
2. Épica
3. Rara
4. Poco Común
5. Común
6. Custom

(Solo aparecen las que tienen cartas)

## Personalización

Puedes personalizar el componente fácilmente:

### Cambiar orden de rarezas
```tsx
const getSortedRarities = (): string[] => {
    const rarityOrder = [
        'Tu Rareza 1',
        'Tu Rareza 2',
        // ...
    ];
    return rarityOrder.filter(rarity => cardsByRarity[rarity]?.length > 0);
};
```

### Ajustar tamaños
Modifica los breakpoints `sm:` en los `className` para cambiar puntos de ruptura.

### Cambiar colores
Usa variantes de `Badge` y propiedades de Tailwind CSS.

## Notas técnicas

- Usa `memo` para evitar re-renders innecesarios
- Implementa `useMemo` para cálculos costosos
- Las secciones se memorizan individualmente
- Compatible con `QuantityControl` atómico
- Totalmente tipado con TypeScript

## Próximos pasos (Opcional)

1. Integrar en `src/pages/collections/index.tsx` con detección de mobile
2. Agregar sincronización de estado expandido
3. Agregar filtros rápidos por rareza
4. Agregar opciones de vista (grid/lista)
5. Agregar búsqueda dentro de las secciones

---

**Créado el**: Noviembre 17, 2025
**Estado**: Listo para producción
**Compatibilidad**: React 18+, TypeScript, Tailwind CSS
