import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { Home, User, ShieldAlert, Heart, Layers, Globe, Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * BottomBar - Componente de navegación inferior para dispositivos móviles
 * Sustituye al Sidebar en pantallas pequeñas para dar un aspecto más nativo
 */
const BottomBar = () => {
  const [location] = useLocation();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [touchedItem, setTouchedItem] = useState<number | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  // Clase para iconos
  const iconBaseClass = "transition-transform duration-150";

  // Enlaces de navegación principales (solo 3)
  const navItems = [
    {
      name: 'Colección',
      path: '/collection',
      icon: (active: boolean) => <Home className={`${iconBaseClass} ${active ? 'h-6 w-6 stroke-[2.5]' : 'h-5 w-5 stroke-2'}`} />
    },
    {
      name: 'Mazos',
      path: '/decks',
      icon: (active: boolean) => <Layers className={`${iconBaseClass} ${active ? 'h-6 w-6 stroke-[2.5]' : 'h-5 w-5 stroke-2'}`} />
    }
  ];

  // Enlaces para el menú desplegable
  const menuItems = [
    {
      name: 'Perfil',
      path: '/profile',
      icon: <User className="h-5 w-5 mr-3" />
    }
  ];

  // Agregar sección de administración si el usuario es admin
  if (isAdmin) {
    navItems.push({
      name: 'Gestionar cartas',
      path: '/admin/cards',
      icon: (active: boolean) => <ShieldAlert className={`${iconBaseClass} ${active ? 'h-6 w-6 stroke-[2.5]' : 'h-5 w-5 stroke-2'}`} />
    });
  }

  const handleMenuToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    setMenuOpen(!menuOpen);
  };

  return (
    <>
      {/* Menú desplegable */}
      <div 
        className={cn(
          "fixed inset-0 bg-black/50 z-40 transition-opacity",
          menuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setMenuOpen(false)}
      >
        <div 
          className={cn(
            "absolute bottom-16 right-0 left-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 rounded-t-xl p-4 transition-transform",
            menuOpen ? "translate-y-0" : "translate-y-full"
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <ul className="space-y-2">
            {menuItems.map((item, index) => (
              <li key={index}>
                <Link 
                  href={item.path}
                  onClick={() => setMenuOpen(false)}
                  className={cn(
                    "flex items-center py-3 px-4 rounded-lg",
                    location === item.path 
                      ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400" 
                      : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                  )}
                >
                  {item.icon}
                  <span className="font-medium">{item.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Barra de navegación inferior */}
      <nav className="fixed bottom-0 left-0 z-50 w-full h-16 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 shadow-lg backdrop-blur-lg bg-opacity-95 dark:bg-opacity-95 select-none">
        <div className="grid grid-cols-4 h-full mx-auto font-medium">
          {navItems.map((item, index) => {
            const isActive = index === 3 ? menuOpen : location === item.path;
            const isTouched = touchedItem === index;
            const isMenu = index === 3;

            return (
              <Link
                key={index}
                href={isMenu ? '#' : item.path}
                onClick={isMenu ? handleMenuToggle : undefined}
                onTouchStart={() => setTouchedItem(index)}
                onTouchEnd={() => setTouchedItem(null)}
                onTouchCancel={() => setTouchedItem(null)}
                className={`inline-flex flex-col items-center justify-center ${
                  isActive
                    ? 'text-blue-600 dark:text-blue-400'
                    : isTouched
                      ? 'text-blue-500 dark:text-blue-400 scale-95'
                      : 'text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400'
                } transition-all duration-150 ease-out`}
              >
                <div className={`${isTouched && !isActive ? 'scale-90' : isActive ? 'scale-110' : 'scale-100'} transition-all duration-150 ease-bounce`}>
                  {item.icon(isActive)}
                </div>

                <span className={`text-xs mt-1 transition-all ${isActive ? 'font-medium' : 'font-normal'}`}>
                  {item.name}
                </span>

                {/* Indicador de navegación activa (no para el menú) */}
                {!isMenu && (
                  <span className={`absolute -bottom-0 w-1/2 max-w-[40px] h-[3px] bg-blue-600 dark:bg-blue-400 rounded-t-full transition-all duration-300 ${isActive ? 'opacity-100' : 'opacity-0'}`}></span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
};

export default BottomBar; 