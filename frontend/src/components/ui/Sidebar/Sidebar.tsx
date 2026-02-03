import React from 'react';
import SidebarContent from './SidebarContent';
import './Sidebar.css';

interface SidebarProps{
    isOpen: boolean;
    onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({isOpen, onClose}) => {
    return(
        <>
            <div className={`sidebar-overlay ${isOpen ? 'active' : ''}`} onClick={onClose} />

            <div className={`sidebar ${isOpen ? 'open' : ''}`}>
                <SidebarContent onClose={onClose}/>
            </div>
        </>
    );
};

export default Sidebar;