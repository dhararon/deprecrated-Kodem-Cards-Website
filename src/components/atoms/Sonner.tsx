import React, { useEffect, useState } from "react";
import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

// Componente Toaster con configuración predeterminada
// Usamos React.memo para evitar renderizados innecesarios
const Toaster = React.memo(function Toaster({
    richColors = true,
    expand = false,
    duration = 4000,
    closeButton = true,
    ...props
}: ToasterProps) {
    // Estado para la posición del toast basado en el tamaño de la pantalla
    const [position, setPosition] = useState<"top-center" | "bottom-left">("bottom-left");

    // Efecto para detectar y actualizar según el tamaño de pantalla
    useEffect(() => {
        // Función para determinar si es móvil (ancho menor a 768px)
        const checkIfMobile = () => {
            const isMobile = window.innerWidth < 768;
            setPosition(isMobile ? "top-center" : "bottom-left");
        };

        // Verificar inicialmente
        checkIfMobile();

        // Actualizar cuando cambie el tamaño de la ventana
        window.addEventListener("resize", checkIfMobile);

        // Limpiar event listener cuando se desmonte el componente
        return () => {
            window.removeEventListener("resize", checkIfMobile);
        };
    }, []);

    return (
        <Sonner
            theme="light"
            className="toaster group"
            position={position}
            expand={expand}
            richColors={richColors}
            closeButton={closeButton}
            duration={duration}
            toastOptions={{
                classNames: {
                    toast:
                        "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg group-[.toaster]:rounded-md",
                    title: "group-[.toast]:font-semibold group-[.toast]:text-sm group-[.toast]:mb-1",
                    description: "group-[.toast]:text-muted-foreground group-[.toast]:text-xs",
                    actionButton:
                        "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:rounded-md group-[.toast]:shadow",
                    cancelButton:
                        "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground group-[.toast]:rounded-md group-[.toast]:shadow",
                    success: "group-[.toast]:border-green-500 group-[.toast]:bg-green-50",
                    error: "group-[.toast]:border-red-500 group-[.toast]:bg-red-50",
                    info: "group-[.toast]:border-blue-500 group-[.toast]:bg-blue-50",
                    warning: "group-[.toast]:border-yellow-500 group-[.toast]:bg-yellow-50",
                    loading: "group-[.toast]:border-gray-500 group-[.toast]:bg-gray-50",
                },
            }}
            {...props}
        />
    )
});

// Ayuda a prevenir problemas de bundling y tree-shaking
Toaster.displayName = "Toaster";

export { Toaster }; 