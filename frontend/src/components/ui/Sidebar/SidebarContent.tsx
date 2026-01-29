import React from 'react';
import {Link} from 'react-router-dom';


const SidebarContent: React.FC = () => {
    return(
        <>
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
        </>
    );
};

export default SidebarContent;