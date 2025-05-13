import { useState } from "react";
import { Checkbox } from "@radix-ui/react-checkbox";
import { Trash } from "lucide-react";
import { motion } from "framer-motion";

export interface TodoItemProps {
    id: string;
    text: string;
    completed: boolean;
    onToggle: (id: string) => void;
    onDelete: (id: string) => void;
}

/**
 * Componente que representa un elemento individual de la lista de tareas
 * @param id Identificador único de la tarea
 * @param text Texto de la tarea
 * @param completed Estado de completado de la tarea
 * @param onToggle Función para cambiar el estado de completado
 * @param onDelete Función para eliminar la tarea
 */
export function TodoItem({ id, text, completed, onToggle, onDelete }: TodoItemProps) {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <motion.div 
            className="flex items-center justify-between p-4 mb-2 bg-white rounded-lg shadow-sm border border-gray-100"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className="flex items-center gap-3">
                <Checkbox
                    checked={completed}
                    onCheckedChange={() => onToggle(id)}
                    className="w-5 h-5 border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                />
                <span className={`text-sm ${completed ? "line-through text-gray-400" : "text-gray-700"}`}>
                    {text}
                </span>
            </div>
            <button 
                onClick={() => onDelete(id)}
                className={`text-red-500 hover:text-red-700 transition-opacity ${isHovered ? 'opacity-100' : 'opacity-0'}`}
                aria-label="Eliminar tarea"
            >
                <Trash size={16} />
            </button>
        </motion.div>
    );
} 