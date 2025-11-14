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
 */
export const DeleteCardButton: React.FC<Props> = ({ cardName, onDelete, isDragging = false }) => {
  return (
    <div 
      className={`absolute top-2 right-2 z-10 transition-opacity duration-150 ${
        isDragging ? 'opacity-0 pointer-events-none' : 'opacity-0 hover:opacity-100 group-hover:opacity-100'
      }`}
    >
      <button
        type="button"
        className="bg-red-600 hover:bg-red-700 text-white rounded-full p-2 shadow-lg flex items-center justify-center h-10 w-10 transition-colors"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
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
