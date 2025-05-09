# Guía de Contribución para Website-Kodem-Cards

¡Gracias por tu interés en contribuir a Website-Kodem-Cards! Esta guía te ayudará a establecer tu entorno de desarrollo y a comprender nuestro flujo de trabajo.

## Tabla de Contenidos

- [Configuración del Entorno de Desarrollo](#configuración-del-entorno-de-desarrollo)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Convenciones de Código](#convenciones-de-código)
- [Flujo de Trabajo con Git](#flujo-de-trabajo-con-git)
- [Proceso de Pull Request](#proceso-de-pull-request)
- [Reportar Bugs](#reportar-bugs)

## Configuración del Entorno de Desarrollo

### Requisitos Previos

- Node.js (versión recomendada: 18.x o superior)
- Bun (para gestión de paquetes y scripts)
- Git

### Instalación

1. Clona el repositorio:
   ```bash
   git clone https://github.com/dhararon/Website-Kodem-Cards
   cd Website-Kodem-Cards
   ```

2. Instala las dependencias:
   ```bash
   bun install
   ```

3. Inicia el servidor de desarrollo:
   ```bash
   bun run dev
   ```

La aplicación estará disponible en `http://localhost:5173`.

## Estructura del Proyecto

El proyecto sigue una estructura basada en dominios:

```
src/
├── components/     # Componentes reutilizables
├── features/       # Características organizadas por dominio
├── hooks/          # Custom hooks de React
├── pages/          # Páginas/rutas de la aplicación
├── services/       # Servicios para API y lógica de negocio
├── types/          # Definiciones de tipos TypeScript
└── utils/          # Utilidades y helpers
```

## Convenciones de Código

### Estilo de Código

- Usamos **snake_case** para variables y funciones
- Usamos **PascalCase** para clases y componentes
- Usamos **UPPER_SNAKE_CASE** para constantes
- Los archivos se nombran con **snake_case.tsx**
- Indentación con tabulador (4 espacios)
- Longitud máxima de línea: 79 caracteres

### TypeScript

- Evita usar `any`, prefiere definir interfaces o tipos
- Documenta las funciones públicas con JSDoc
- Limita los archivos a 600 líneas de código
- Limita los métodos a 30 líneas de código

### React

- Usa componentes funcionales y hooks
- NO uses estilos inline
- Organiza las importaciones en este orden:
  1. Importaciones de React y librerías base
  2. Importaciones de librerías externas
  3. Importaciones internas del proyecto
- Separa la lógica (contenedores) de la presentación (componentes UI)

### Tailwind

- Usa clases de Tailwind para todo el estilado
- Diseña con enfoque "mobile-first"
- Optimiza para dispositivos móviles
- Prioriza la legibilidad antes que la optimización

## Flujo de Trabajo con Git

### Branches

- `main`: Branch de producción
- `develop`: Branch de desarrollo
- `feature/*`: Para nuevas características
- `bugfix/*`: Para corrección de bugs
- `hotfix/*`: Para correcciones urgentes en producción

### Commits

Seguimos la convención de [Conventional Commits](https://www.conventionalcommits.org):

```
<tipo>(<ámbito>): <descripción>

<cuerpo>

-Agent Generated Commit Message
```

Tipos de commits:
- `feat`: Nuevas características
- `fix`: Solución de errores
- `docs`: Cambios en documentación
- `style`: Cambios de estilo que no afectan la lógica
- `refactor`: Refactorización de código existente
- `perf`: Mejoras de rendimiento
- `test`: Adición de pruebas
- `chore`: Tareas de mantenimiento

Ejemplo:
```
feat(auth): implementar autenticación con JWT

-Agent Generated Commit Message
```

## Proceso de Pull Request

1. Asegúrate de que tu código pase todas las pruebas locales
2. Crea una PR desde tu branch a `develop`
3. Describe los cambios realizados
4. Agrega cualquier información adicional relevante (capturas, enlaces)
5. Espera la revisión del código
6. Aborda cualquier comentario o solicitud de cambio
7. Una vez aprobada, se realizará el merge

## Reportar Bugs

Para reportar un bug, crea un nuevo issue con la etiqueta "bug" e incluye:

1. Título descriptivo
2. Pasos para reproducir el problema
3. Comportamiento esperado
4. Comportamiento actual
5. Capturas de pantalla (si aplica)
6. Entorno (navegador, sistema operativo, etc.)

---

¡Gracias por contribuir al proyecto Website-Kodem-Cards! Si tienes alguna pregunta, no dudes en contactar al equipo de desarrollo. 