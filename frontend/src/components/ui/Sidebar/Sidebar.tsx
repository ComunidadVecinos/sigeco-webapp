import React from 'react';
import SidebarContent from './SidebarContent';

interface SidebarProps{
    isOpen: boolean;
    onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({isOpen, onClose}) => {
    return(
        <>
            <div className={`fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 z-[1000] ${isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`} onClick={onClose} />

            <div className={`fixed top-0 w-80 h-screen bg-gradient-to-b from-white to-gray-50 shadow-[4px_0_20px_rgba(0,0,0,0.1)] transition-[left] duration-300 ease-in-out z-[1001] p-7 flex flex-col ${isOpen ? 'left-0' : 'left-[-320px]'}`}>
                <SidebarContent onClose={onClose}/>
            </div>
        </>
    );
};

export default Sidebar;