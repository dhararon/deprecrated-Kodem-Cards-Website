# Plantillas de Código para Kodem Cards

Este directorio contiene plantillas para crear nuevos componentes, servicios, hooks y contextos siguiendo las convenciones del proyecto.

## Uso de las Plantillas

Para usar estas plantillas, copia el archivo correspondiente a la ubicación deseada y renómbralo según la funcionalidad que estás implementando. Luego, reemplaza los nombres genéricos (como `ComponentName` o `ContextName`) con nombres específicos para tu implementación.

### Plantillas Disponibles

| Archivo | Descripción | Uso Recomendado |
|---------|-------------|-----------------|
| `component.template.tsx` | Plantilla completa para componentes React | Componentes complejos con múltiples props y lógica |
| `functional-component.template.tsx` | Plantilla simple para componentes funcionales | Componentes de presentación sencillos |
| `service.template.ts` | Plantilla para servicios Firebase | Servicios que interactúan con Firestore |
| `hook.template.ts` | Plantilla para custom hooks | Lógica reutilizable entre componentes |
| `context.template.tsx` | Plantilla para contextos React | Gestión de estado global o para árboles de componentes |
| `store.template.ts` | Plantilla para tiendas Zustand | Gestión de estado global con Zustand |
| `test.template.tsx` | Plantilla para pruebas unitarias | Tests con Jest y React Testing Library |

## Convenciones de Nomenclatura

- **Componentes**: Nombres en PascalCase (ej. `CardSearch`, `DeckForm`)
- **Servicios**: Nombres en camelCase seguidos de "Service" (ej. `deckService`, `authService`)
- **Hooks**: Prefijo "use" seguido de nombre en PascalCase (ej. `useAuth`, `useDeckSearch`)
- **Contextos**: Nombre en PascalCase seguido de "Context" (ej. `AuthContext`, `DeckContext`)

## Estructura de Directorios

Al crear nuevos archivos, sigue la estructura de directorios establecida en el proyecto:

```
src/
├── components/       # Componentes React
│   ├── atoms/        # Componentes base
│   ├── molecules/    # Componentes compuestos
│   └── organisms/    # Componentes complejos
├── hooks/            # Custom hooks
├── context/          # Contextos React
├── lib/
│   └── firebase/
│       └── services/ # Servicios Firebase
└── types/            # Interfaces y tipos
```

## Mejores Prácticas

1. **Documentación**: Mantén los comentarios JSDoc en todas las interfaces, componentes y funciones.
2. **Tipado**: Asegúrate de definir tipos para todas las props, estados y valores de retorno.
3. **Pruebas**: Crea pruebas unitarias para cada nuevo componente o servicio.
4. **Consistencia**: Sigue el mismo estilo de código que se ve en las plantillas.

## Ejemplo de Uso

### Crear un nuevo componente:

1. Copia `component.template.tsx` a `src/components/molecules/SearchFilter.tsx`
2. Reemplaza todas las ocurrencias de `ComponentName` con `SearchFilter`
3. Actualiza la interfaz de props según las necesidades del componente
4. Implementa la lógica específica del componente
5. Documenta el componente siguiendo el formato JSDoc existente
6. Crea pruebas en `src/__tests__/components/SearchFilter.test.tsx`

### Crear un nuevo servicio:

1. Copia `service.template.ts` a `src/lib/firebase/services/categoryService.ts`
2. Reemplaza `COLLECTION_NAME` con el nombre de la colección en Firestore
3. Actualiza las interfaces `DataItem` y `CreateDataInput` con los campos específicos
4. Implementa cualquier método adicional necesario
5. Exporta el objeto de servicio al final del archivo 