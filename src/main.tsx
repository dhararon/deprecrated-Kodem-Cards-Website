import * as React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'
// Importar el script que asegura el tema claro
import './lib/clear-theme'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './lib/query-client'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { AuthProvider } from '@/context/auth'
import { Toaster } from '@/components/atoms/Sonner'


// Inicializar el tema según las preferencias guardadas
const initialTheme = () => {
  // Forzar el tema claro por defecto
  document.documentElement.classList.remove('dark', 'light');
  document.documentElement.classList.add('light');
  document.documentElement.style.colorScheme = 'light';

  // Guardar el tema claro en localStorage
  localStorage.setItem('theme', 'light');
};

// Ejecutar la inicialización del tema
initialTheme();


// Actualizado para React 19
const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Root element not found');

const root = createRoot(rootElement);
root.render(
  // React 19 tiene diferente manejo de StrictMode, lo removemos temporalmente
  <>
    <Toaster />
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <App />
      </AuthProvider>
      {/* Solo se muestra en desarrollo */}
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  </>
)
