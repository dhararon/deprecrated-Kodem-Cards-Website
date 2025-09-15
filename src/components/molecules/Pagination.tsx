import * as React from "react"
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/atoms/Button"

export interface PaginationProps extends React.ComponentProps<"nav"> {
    totalItems: number;
    itemsPerPage: number;
    currentPage: number;
    onPageChange: (page: number) => void;
    siblingCount?: number;
}

/**
 * Pagination - Componente para la paginación con soporte para muchas páginas
 */
export function Pagination({
    className,
    totalItems,
    itemsPerPage,
    currentPage,
    onPageChange,
    siblingCount = 1,
    ...props
}: PaginationProps) {
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    // Función para generar el rango de páginas a mostrar
    const generatePaginationRange = () => {
        const totalPageNumbers = siblingCount * 2 + 3; // Siblings + current + first + last

        // Si el número total de páginas es menor que el número total de botones a mostrar
        if (totalPages <= totalPageNumbers) {
            return Array.from({ length: totalPages }, (_, i) => i + 1);
        }

        const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
        const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);

        const shouldShowLeftDots = leftSiblingIndex > 2;
        const shouldShowRightDots = rightSiblingIndex < totalPages - 1;

        if (!shouldShowLeftDots && shouldShowRightDots) {
            const leftItemCount = 3 + 2 * siblingCount;
            const leftRange = Array.from({ length: leftItemCount }, (_, i) => i + 1);
            return [...leftRange, "...", totalPages];
        }

        if (shouldShowLeftDots && !shouldShowRightDots) {
            const rightItemCount = 3 + 2 * siblingCount;
            const rightRange = Array.from(
                { length: rightItemCount },
                (_, i) => totalPages - rightItemCount + i + 1
            );
            return [1, "...", ...rightRange];
        }

        if (shouldShowLeftDots && shouldShowRightDots) {
            const middleRange = Array.from(
                { length: rightSiblingIndex - leftSiblingIndex + 1 },
                (_, i) => leftSiblingIndex + i
            );
            return [1, "...", ...middleRange, "...", totalPages];
        }

        return [];
    };

    const pages = generatePaginationRange();

    return (
        <nav
            role="navigation"
            aria-label="Paginación"
            className={cn("mx-auto flex w-full justify-center", className)}
            {...props}
        >
            <ul className="flex flex-row items-center gap-1">
                <li>
                    <Button
                        aria-label="Ir a la página anterior"
                        size="sm"
                        variant="ghost"
                        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                        disabled={currentPage <= 1}
                        className="gap-1 px-2.5"
                    >
                        <ChevronLeft className="h-4 w-4" />
                        <span>Anterior</span>
                    </Button>
                </li>

                {pages.map((page, index) => {
                    if (page === "...") {
                        return (
                            <li key={`ellipsis-${index}`}>
                                <span
                                    aria-hidden
                                    className="flex h-9 w-9 items-center justify-center"
                                >
                                    <MoreHorizontal className="h-4 w-4" />
                                    <span className="sr-only">Más páginas</span>
                                </span>
                            </li>
                        );
                    }

                    return (
                        <li key={`page-${page}`}>
                            <Button
                                aria-current={currentPage === page ? "page" : undefined}
                                variant={currentPage === page ? "outline" : "ghost"}
                                size="sm"
                                onClick={() => onPageChange(page as number)}
                                className="h-9 w-9 p-0 flex items-center justify-center"
                            >
                                {page}
                            </Button>
                        </li>
                    );
                })}

                <li>
                    <Button
                        aria-label="Ir a la página siguiente"
                        size="sm"
                        variant="ghost"
                        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage >= totalPages}
                        className="gap-1 px-2.5"
                    >
                        <span>Siguiente</span>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </li>
            </ul>
        </nav>
    );
} 