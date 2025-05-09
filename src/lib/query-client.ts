import { QueryClient } from '@tanstack/react-query';

// Configuración del cliente de consultas
const defaultQueryClientOptions = {
    defaultOptions: {
        queries: {
            staleTime: 5 * 60 * 1000, // 5 minutos
            cacheTime: 10 * 60 * 1000, // 10 minutos
            refetchOnWindowFocus: false,
            retry: 1,
        },
        mutations: {
            retry: 1,
        },
    },
};

// Crear una instancia del cliente de consultas
export const queryClient = new QueryClient(defaultQueryClientOptions);

// Reiniciar cliente para pruebas o como sea necesario
export const resetQueryClient = () => {
    queryClient.clear();
}; 