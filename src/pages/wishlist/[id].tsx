import React from "react";
import { EmptyState } from "@/components/molecules/EmptyState";

/**
 * Página de detalle de una lista de deseos: la funcionalidad fue eliminada.
 */
export default function WishlistDetail() {
    return (
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
            <EmptyState
                title="Funcionalidad removida"
                description="La sección de listas de deseos ya no está disponible en la plataforma."
                icon="heart"
            />
        </div>
    );
}
