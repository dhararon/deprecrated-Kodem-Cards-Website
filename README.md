# Kodem Cards

![Kodem Cards Logo](./public/logo.png)

## Descripción

Kodem Cards es una aplicación web para coleccionistas y jugadores de cartas de Kodem, permitiendo crear, gestionar y compartir mazos personalizados.

## Características Principales

- 🃏 **Exploración de cartas**: Busca y filtra por tipo, rareza, elemento y más
- 🎮 **Constructor de mazos**: Crea tus propios mazos con un intuitivo creador drag-and-drop
- 🌟 **Mazos populares**: Descubre mazos creados por la comunidad
- 👤 **Perfiles de usuario**: Gestiona tu colección y mazos favoritos
- 🔍 **Buscador avanzado**: Encuentra cartas específicas con múltiples criterios
- 📱 **Diseño responsive**: Funciona en dispositivos móviles, tablets y escritorio

## Tecnologías

- ⚛️ React + TypeScript
- 🔥 Firebase (Firestore, Auth)
- 🎨 Tailwind CSS
- 🧩 Zustand para gestión de estado
- 🚀 Vite como bundler
- 🧪 Jest y Cypress para testing

## Requisitos Previos

- Node.js 16.x o superior
- npm 8.x o superior (o yarn/pnpm)
- Cuenta de Firebase (para desarrollo local)

## Instalación

1. Clona el repositorio:
   ```bash
   git clone https://github.com/tuorganizacion/kodem-cards.git
   cd kodem-cards
   ```

2. Instala las dependencias:
   ```bash
   bun install
   ```

3. Configura las variables de entorno:
   ```bash
   cp .env.example .env.local
   ```
   Edita `.env.local` con tus credenciales de Firebase.

4. Inicia el servidor de desarrollo:
   ```bash
   bun dev
   ```

## Scripts Disponibles

- `bun dev` - Inicia el servidor de desarrollo
- `bun build` - Compila la aplicacion con console.log
- `bun build:production` - Compila la aplicación para producción
- `bun run deploy` - Ejecuta las pruebas unitarias
- `bun run deploy:rules` - Envia solo cambios de permisos en firebase
- `bun analyze-deps` - Analiza las dependencias del proyecto
- `bun emulators` - Inicia los emuladores de Firebase

## Estructura del Proyecto

```
src/
├── components/           # Componentes de React (Atomic Design)
│   ├── atoms/           # Componentes base
│   ├── molecules/       # Componentes compuestos
│   ├── organisms/       # Componentes complejos
│   └── templates/       # Layouts de página
├── hooks/               # Custom hooks
├── lib/                 # Bibliotecas y servicios
│   └── firebase/        # Configuración y servicios de Firebase
├── pages/               # Componentes de página
├── store/               # Estado global (Zustand)
├── styles/              # Estilos globales
├── types/               # Definiciones de TypeScript
└── utils/               # Utilidades y helpers
```

## Fixtures

Para llenar la base de datos local con las cartas en produccion, inicializa los emuladores `$ bun emulators` y despues con la herramienta `firefoo` aplica el backup en una colleccion llamada `cards`.  El backup de las cartas esta en `fixtures/cards.json`

## Documentación

La documentación detallada está disponible en el directorio `docs/`:


## Performance

La aplicación está optimizada para:

- First Contentful Paint (FCP) < 1.8s
- Largest Contentful Paint (LCP) < 2.5s
- Cumulative Layout Shift (CLS) < 0.1
- First Input Delay (FID) < 100ms

## Licencia

Este proyecto está bajo la licencia MIT. Ver el archivo [LICENSE](./LICENSE) para más detalles.

## Contribuir

Las contribuciones son bienvenidas. Por favor, lee la [guía de contribución](./docs/CONTRIBUTING.md) antes de enviar pull requests.

## Contacto

Para preguntas o soporte, por favor contacta a: dhargames@gmail.com
