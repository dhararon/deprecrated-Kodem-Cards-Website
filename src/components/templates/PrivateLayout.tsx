import React, { ReactNode } from 'react';
import Topbar from '@/components/organisms/Sidebar';
import BottomBar from '@/components/organisms/BottomBar';
import { SidebarContext } from '@/context/sidebar/SidebarContext';

interface PrivateLayoutProps {
    children: ReactNode;
}

export default function PrivateLayout({ children }: PrivateLayoutProps) {
    const { isSmallScreen } = React.useContext(SidebarContext);

    return (
        <div className="min-h-screen bg-white flex flex-col">
            {/* Mostrar TopBar solo en pantallas grandes */}
            {!isSmallScreen && <Topbar />}
            <main className={`flex-1 overflow-x-hidden overflow-y-auto bg-white ${isSmallScreen ? 'pt-0 pb-16' : 'pt-16'}`}>
                <div className={`container mx-auto ${isSmallScreen ? 'px-4 py-4 pb-20' : 'px-6 py-8'}`}>
                    {children}
                </div>
            </main>
            {/* Mostrar BottomBar solo en pantallas pequeñas */}
            {isSmallScreen && <BottomBar />}
        </div>
    );
} 