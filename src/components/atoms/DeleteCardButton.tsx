import React from 'react';
import { Trash2 } from 'lucide-react';

type Props = {
  cardName: string;
  onDelete: () => void;
  isDragging?: boolean;
};

/**
 * Botón de eliminar carta (ATOM)
 * Aparece en hover en la esquina superior derecha de una carta
 * Diseño: botón circular rojo con icono de basura
 * Nota: pointer-events-auto asegura que el click no sea capturado por DND
 */
export const DeleteCardButton: React.FC<Props> = ({ cardName, onDelete, isDragging = false }) => {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    // Detener propagación del evento para evitar que DND lo capture
    e.preventDefault();
    e.stopPropagation();
    
    // Ejecutar la acción de eliminar
    onDelete();
  };

  return (
    <div 
      className={`absolute top-2 right-2 z-20 transition-opacity duration-150 pointer-events-auto
        ${isDragging ? 'opacity-0 pointer-events-none' : 'opacity-100 md:opacity-0 md:hover:opacity-100 md:group-hover:opacity-100'}
      `}
    >
      <button
        type="button"
        className="bg-red-600 hover:bg-red-700 text-white rounded-full p-2 shadow-lg flex items-center justify-center h-10 w-10 transition-colors active:bg-red-800"
        onClick={handleClick}
        onMouseDown={(e) => {
          // Asegurarse de que el mouseDown también se detiene
          e.stopPropagation();
          e.preventDefault();
        }}
        onTouchStart={(e) => {
          // Para dispositivos táctiles
          e.stopPropagation();
        }}
        aria-label={`Eliminar ${cardName} del mazo`}
        title={`Eliminar ${cardName}`}
        style={{ outline: 'none', border: 'none' }}
      >
        <Trash2 size={20} color="white" />
      </button>
    </div>
  );
};

export default DeleteCardButton;
