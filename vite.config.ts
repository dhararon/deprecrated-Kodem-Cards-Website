import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import removeConsole from 'vite-plugin-remove-console'

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  const isProduction = mode === 'production';

  return {
    plugins: [
      react({
        // Siempre usar automatic JSX Runtime
        jsxRuntime: 'automatic',
        babel: {
          plugins: []
        }
      }),
      tailwindcss(),
      // Solo eliminar los console.log en producción
      isProduction && removeConsole()
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      }
    },
    server: {
      port: 3000,
      open: false,
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
      minify: 'terser',
      target: 'esnext',
      emptyOutDir: true,
      // Incrementar el límite de advertencia para chunks grandes
      chunkSizeWarningLimit: 800,
      rollupOptions: {
        output: {
          // Configuración de chunks manuales para optimizar la carga
          manualChunks: {
            'react-vendor': ['react', 'react-dom', 'wouter'],
            'firebase-core': ['firebase/app', 'firebase/auth', 'firebase/firestore'],
            'firebase-storage': ['firebase/storage'],
            'ui-lib': [
              '@/components/atoms/Button.tsx',
              '@/components/atoms/Avatar.tsx',
              '@/components/atoms/Badge.tsx',
              '@/components/atoms/Input.tsx'
            ],
            'collection': ['@/context/CollectionContext'],
            'cards-logic': ['@/lib/firebase/cardsService']
          }
        }
      },
      terserOptions: {
        compress: {
          // Opciones adicionales para Terser
          drop_console: true, // Eliminar todas las llamadas console.*
          drop_debugger: true, // Eliminar declaraciones debugger
          pure_funcs: ['console.log', 'console.info', 'console.debug', 'console.warn'], // Funciones a eliminar
        },
        format: {
          comments: false, // Eliminar todos los comentarios
        }
      }
    },
    define: {
      'process.env.NODE_ENV': JSON.stringify(isProduction ? 'production' : 'development'),
      'process.env': {},
      // Configuración para next/image
      'process.env.NEXT_PUBLIC_ALLOWED_IMAGE_DOMAINS': JSON.stringify(['firebasestorage.googleapis.com']),
      'global.Image': 'Image',
    }
  }
})
