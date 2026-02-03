import React from 'react';
import {Link} from 'react-router-dom';
import './Sidebar.css';

interface SidebarContentProps{
    onClose?: () => void;
}

const SidebarContent: React.FC<SidebarContentProps> = ({onClose}) => {
    return(
        <>
            <button className="sidebar-close" onClick={onClose}>
                <i className="bi bi-x-lg"></i>
            </button>

            <div className="sidebar-header">
                <h4 className='fw-bold'>Mi comunidad</h4>
            </div>

            <h5 className='sidebar-sub-title'>Espacio Comunitario</h5>

            <nav className="sidebar-nav">
                <Link to="/" className='sidebar-link'><i className="bi bi-megaphone"></i>Tablón de noticias</Link>
                <Link to="/" className='sidebar-link'><i className="bi bi-chat-dots"></i>Foro</Link>
                <Link to="/" className='sidebar-link'><i className="bi bi-calendar-check"></i>Reserva de espacios</Link>
                <Link to="/" className='sidebar-link'><i className="bi bi-exclamation-triangle"></i>Incidencias</Link>
                <Link to="/" className='sidebar-link'><i className="bi bi-check2-square"></i>Votaciones</Link>
                <Link to="/" className='sidebar-link'><i className="bi bi-folder"></i>Documentos</Link>
            </nav>        
        </>
    );
};

export default SidebarContent;