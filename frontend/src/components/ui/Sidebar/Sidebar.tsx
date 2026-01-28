import React from 'react';
import {Link} from 'react-router-dom';
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
                <div className="sidebar-header">
                    <h4 className='fw-bold'>Mi comunidad</h4>
                </div>
                <h5 className='fw-bold sidebar-sub-title'>Espacio Comunitario</h5>
                <nav className="sidebar-nav mt-3">
                    <Link to="/" className='sidebar-link'>Tablón de noticias</Link>
                    <Link to="/" className='sidebar-link'>Foro</Link>
                    <Link to="/" className='sidebar-link'>Reserva de espacios comunes</Link>
                    <Link to="/" className='sidebar-link'>Reporte de Incidencias</Link>
                    <Link to="/" className='sidebar-link'>Votaciones</Link>
                    <Link to="/" className='sidebar-link'>Documentos</Link>
                </nav>

                <div className="mt-auto p-3 text-center border-top">
                    <button className='btn btn-sm text-secondary'><i className="bi bi-box-arrow-left me-2"></i>Cerrar Sesión</button>
                </div>
            </div>

            
        </>
    );
};

export default Sidebar;