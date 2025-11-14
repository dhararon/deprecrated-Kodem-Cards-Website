import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { Trash2 } from 'lucide-react';

type Props = {
  visible: boolean;
};

export const DroppableTrash: React.FC<Props> = ({ visible }) => {
  const { isOver, setNodeRef } = useDroppable({ id: 'trash-dropzone' });

  if (!visible) return null;

  return (
    <div
      ref={setNodeRef}
      className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 max-w-[900px] w-[90%] pointer-events-auto transition-all ${isOver ? 'scale-105' : ''}`}
      aria-hidden={!visible}
    >
      <div className={`w-full flex items-center justify-center p-4 rounded-md shadow-lg ${isOver ? 'bg-red-600 text-white' : 'bg-red-100 text-red-800'}`}>
        <div className="flex items-center gap-3">
          <div className="bg-red-500 rounded-full p-3 shadow-lg">
            <Trash2 size={28} className="text-white" />
          </div>
          <div className="text-sm font-medium">
            {isOver ? 'Suelta aquí para eliminar' : 'Arrastra aquí para eliminar carta'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DroppableTrash;
