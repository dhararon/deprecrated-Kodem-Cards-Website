# Registro de Cambios (Changelog)

## [1.0.1] - 2024-06-xx

### Mejoras
- Implementación de scripts de limpieza automática de código
- Creación de documentación de calidad de código
- Configuración mejorada de ESLint
- Refactorización de los contextos para cumplir con las reglas de Fast Refresh
- Patrón de separación de contextos implementado en WishlistContext y AuthContext
- Creación de hooks dedicados para el consumo de contextos (useWishlist, useAuth)

### Correcciones
- Resolución de errores críticos de linting
- Eliminación de referencias e importaciones no utilizadas
- Corrección de problemas con hooks de React y sus dependencias
- Reemplazo de tipos `any` por `unknown` o tipos más específicos en múltiples archivos
- Solución a problemas de React Fast Refresh separando contextos y hooks
- Implementación de la función `getFromStore` para evitar llamadas a hooks fuera de componentes
- Actualización del archivo LICENSE con la licencia MIT
- Creación de guía de contribución
- Refactorización completa de DeckEditor.tsx para eliminar warnings de código no utilizado
- Mover utilidades a archivos independientes siguiendo buenas prácticas
- División de contextos complejos en múltiples archivos: tipos, provider, hook y barril

### Dependencias
- Eliminación de dependencias no utilizadas en package.json
- Instalación de dependencias necesarias para ESLint 