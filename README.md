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

## Sistema de versionado y releases

Este proyecto utiliza un sistema automatizado de versionado semántico basado en los mensajes de commit.

### Requisitos previos

Para utilizar la funcionalidad de releases, necesitas configurar un token de GitHub con los permisos adecuados:

1. Crea un [token de acceso personal en GitHub](https://github.com/settings/tokens) con el permiso `repo`
2. Configura el token de una de estas formas:
   - Establece la variable de entorno `GITHUB_TOKEN`
   - Crea un archivo `~/.github_token` con tu token

### Comandos disponibles

| Comando | Descripción |
|---------|-------------|
| `bun run tag` | Analiza los commits y sugiere una nueva versión |
| `bun run tag:create` | Crea un tag local con la versión sugerida |
| `bun run tag:push` | Crea un tag y lo sube al repositorio remoto |
| `bun run tag:push:force` | Crea y sube un tag, incluso si hay errores con tags pendientes |
| `bun run release` | Crea un tag, lo sube y genera un release en GitHub |
| `bun run release:pre` | Crea un tag, lo sube y genera un release de pre-lanzamiento |
| `bun run release:last` | Genera un release para el último tag existente si no tiene uno |
| `bun run release:last:pre` | Genera un release de pre-lanzamiento para el último tag existente |

### Cómo funciona el versionado semántico

El script analiza los mensajes de commit desde el último tag y determina el tipo de cambio:

- **MAJOR** (incremento en el primer número): Si algún commit contiene `BREAKING CHANGE` o `!:`
- **MINOR** (incremento en el segundo número): Si algún commit comienza con `feat:`
- **PATCH** (incremento en el tercer número): Si algún commit comienza con `fix:`

### Ejemplos de flujo de trabajo

#### Publicar una nueva versión

```bash
# Hacer commits con el formato adecuado
git commit -m "feat: nueva funcionalidad"
git commit -m "fix: solución de bug"

# Generar una nueva versión y release
bun run release
```

#### Crear una pre-release

```bash
# Hacer commits normalmente
git commit -m "feat: funcionalidad experimental"

# Generar una pre-release
bun run release:pre
```

#### Crear un release para un tag existente

Si ya has creado un tag manualmente pero quieres generar un release en GitHub:

```bash
# Crear un release para el último tag existente
bun run release:last
```

#### Verificar y generar releases faltantes

Si quieres asegurarte de que el último tag tiene un release:

```bash
# Verificar si el último tag tiene release y crearlo si no existe
bun run release:last
```
