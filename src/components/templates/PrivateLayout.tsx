import React, { ReactNode } from 'react';
import Sidebar from '@/components/organisms/Sidebar';
import BottomBar from '@/components/organisms/BottomBar';
import { SidebarContext } from '@/context/sidebar/SidebarContext';

interface PrivateLayoutProps {
    children: ReactNode;
}

export default function PrivateLayout({ children }: PrivateLayoutProps) {
    const { isSmallScreen } = React.useContext(SidebarContext);

    return (
        <div className="flex h-screen bg-white">
            {/* Mostrar Sidebar solo en pantallas grandes */}
            {!isSmallScreen && <Sidebar />}
            
            <div className={`flex-1 flex flex-col overflow-hidden ${isSmallScreen ? 'pb-16' : ''}`}>
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-white">
                    <div className={`container mx-auto ${isSmallScreen ? 'px-4 py-4 pb-20' : 'px-6 py-8'}`}>
                        {children}
                    </div>
                </main>
            </div>
            
            {/* Mostrar BottomBar solo en pantallas pequeñas */}
            {isSmallScreen && <BottomBar />}
        </div>
    );
} 