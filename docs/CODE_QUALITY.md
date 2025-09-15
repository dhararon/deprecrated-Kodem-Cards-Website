# Guía de Calidad de Código para Website-Kodem-Cards

Este documento proporciona información sobre la calidad del código en el proyecto y ofrece recomendaciones para seguir mejorando.

## Herramientas de Calidad

El proyecto utiliza las siguientes herramientas para mantener la calidad del código:

- **ESLint**: Para análisis estático de código y seguimiento de estándares
- **TypeScript**: Para tipado estático
- **Prettier**: Para formateo de código (se recomienda configurarlo si no está ya configurado)

## Comandos de Linting

Se han configurado los siguientes comandos en el proyecto:

```bash
# Ejecutar linting con errores estrictos (sin permitir advertencias)
bun lint

# Corregir automáticamente problemas de linting que se puedan resolver
bun lint:fix

# Generar un reporte de linting en formato JSON
bun lint:report

# Verificar el código con un límite de advertencias alto (para desarrollo)
bun lint:check

# Limpiar automáticamente el código (usando scripts)
bun clean:code
```

## Buenas Prácticas para Mantener un Código Limpio

### Evitar Tipos `any`

Reemplaza los tipos `any` por `unknown` o tipos más específicos:

```typescript
// ❌ Malo
function processData(data: any): any {
  return data.value;
}

// ✅ Bueno
function processData(data: unknown): unknown {
  if (typeof data === 'object' && data !== null && 'value' in data) {
    return (data as { value: unknown }).value;
  }
  return null;
}
```

### Eliminar Importaciones No Utilizadas

Elimina las importaciones que no se usan en el archivo:

```typescript
// ❌ Malo
import React, { useState, useEffect, useRef, useMemo } from 'react';
// Solo usas useState y useEffect

// ✅ Bueno
import React, { useState, useEffect } from 'react';
```

### Variables No Utilizadas

Prefija con guion bajo (`_`) las variables no utilizadas o elimínalas:

```typescript
// ❌ Malo
function Component({ id, name, price }) {
  // Solo usamos id y price
  return <div>{id}: ${price}</div>;
}

// ✅ Bueno
function Component({ id, _name, price }) {
  return <div>{id}: ${price}</div>;
}
```

### Dependencias de Hooks

Asegúrate de incluir todas las dependencias necesarias en los arrays de dependencias de hooks:

```typescript
// ❌ Malo
useEffect(() => {
  fetchData(userId);
}, []); // Missing dependency: userId

// ✅ Bueno
useEffect(() => {
  fetchData(userId);
}, [userId]);
```

### Problemas con Fast Refresh

Evita exportar funciones y componentes juntos en el mismo archivo:

```typescript
// ❌ Malo - Exportar hooks/funciones y componentes desde el mismo archivo
export const formatName = (name) => name.toUpperCase();
export const UserComponent = () => <div>{formatName('John')}</div>;

// ✅ Bueno - Separar en diferentes archivos
// utils/formatters.ts
export const formatName = (name) => name.toUpperCase();

// components/UserComponent.tsx
import { formatName } from '../utils/formatters';
export const UserComponent = () => <div>{formatName('John')}</div>;
```

#### Separación de Contextos

Para contextos de React, divídelos en múltiples archivos para evitar problemas con React Fast Refresh y mejorar la mantenibilidad:

```typescript
// ❌ Malo - Todo en un solo archivo (Context.tsx)
export const MyContext = createContext();
export const useMyContext = () => useContext(MyContext);
export const MyProvider = ({ children }) => {/*...*/};

// ✅ Bueno - Separado en archivos
// context/mycontext/MyContext.ts (solo el contexto y tipos)
export interface MyContextType {/*...*/}
export const MyContext = createContext<MyContextType | undefined>(undefined);

// context/mycontext/MyProvider.tsx (implementación del provider)
import { MyContext } from './MyContext';
export const MyProvider = ({ children }) => {/*...*/};

// hooks/useMyContext.ts (hook para usar el contexto)
import { MyContext } from '../context/mycontext/MyContext';
export const useMyContext = () => {/*...*/};

// context/mycontext/index.ts (archivo de barrel) 
export * from './MyContext';
export { default as MyProvider } from './MyProvider';
```

Este patrón se ha implementado con éxito en:

1. **Contexto de Autenticación**:
   - `src/context/auth/AuthContext.ts`: Definiciones de tipos e interfaz del contexto
   - `src/context/auth/AuthProvider.tsx`: Implementación del provider
   - `src/hooks/useAuth.ts`: Hook para consumir el contexto
   - `src/context/auth/index.ts`: Archivo barril para re-exportaciones

2. **Contexto de Lista de Deseos (Wishlist)**:
   - `src/context/wishlist/WishlistContext.ts`
   - `src/context/wishlist/WishlistProvider.tsx`
   - `src/hooks/useWishlist.ts`
   - `src/context/wishlist/index.ts`

Este enfoque:
- Mejora la separación de responsabilidades
- Evita problemas con React Fast Refresh
- Facilita las pruebas unitarias
- Reduce el tamaño de los archivos individuales
- Mejora la navegación y mantenimiento del código

## Estrategia para Limpiar el Código Existente

1. **Enfoque gradual**: Corrige primero los errores críticos, luego las advertencias
2. **Priorización**: Céntrate primero en los archivos más utilizados y de negocio
3. **Automatización**: Usa los scripts de limpieza para automatizar las correcciones comunes

### Orden recomendado para correcciones:

1. Eliminar importaciones no utilizadas
2. Corregir las dependencias de los hooks React
3. Reemplazar los tipos `any` por `unknown` o tipos más específicos
4. Separar las funciones en archivos independientes para evitar problemas con Fast Refresh
5. Refactorizar contextos y hooks en archivos separados

## Comandos Personalizados

El proyecto incluye scripts personalizados para ayudar a limpiar el código:

- `scripts/fix-lint-issues.js`: Corrige automáticamente problemas comunes como variables no utilizadas
- `scripts/fix-react-hooks.js`: Intenta corregir problemas con las dependencias de los hooks de React
- `scripts/clean-code.js`: Script principal que ejecuta todos los scripts de limpieza

## Configuración de ESLint

La configuración de ESLint se encuentra en `eslint.config.js`. Puedes modificar esta configuración para:

- Cambiar el nivel de severidad de ciertas reglas
- Agregar nuevas reglas específicas para el proyecto
- Excluir ciertos archivos o directorios del linting

## Integración Continua

Se recomienda configurar el linting como parte del pipeline de CI para asegurar que no se agreguen nuevos problemas al código.

## Recursos Adicionales

- [Documentación de ESLint](https://eslint.org/docs/latest/)
- [Guías de estilo de TypeScript](https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html)
- [Reglas de hooks de React](https://legacy.reactjs.org/docs/hooks-rules.html)
