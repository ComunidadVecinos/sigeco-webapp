//La barra de navegacion con el logo y el boton de acceso

import React from 'react';
import logo from '../../../assets/images/2.png';
import {Link} from 'react-router-dom';

const Header: React.FC = () =>{
    return(
        <header className="header-common">
            <nav className="navbar bg-body-tertiary flex-column">
                <div className="container-fluid d-flex flex-column">

                    <div className="d-flex w-100 align-items-center mb-2">
                        <div className="me-auto">
                            <Link to="/" className="navbar-brand">
                                <img src={logo} alt="Sigeco" className="img-logo" />
                            </Link>
                        </div>

                        <div className="flex-grow-1 mx-3">
                            <form className="d-flex" role="search">
                                <input className="form-control me-2" type="search" placeholder="Busqueda en toda la Comunidad..." aria-label="Search"/>
                            </form>
                        </div>

                        <div className="ms-auto">
                            <button className="btn btn-perfil me-5">
                                <svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" fill="#104084" className="bi bi-person-circle" viewBox="0 0 16 16"><path d="M11 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0"/><path fill-rule="evenodd" d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8m8-7a7 7 0 0 0-5.468 11.37C3.242 11.226 4.805 10 8 10s4.757 1.225 5.468 2.37A7 7 0 0 0 8 1"/></svg>
                            </button>
                        </div>

                    </div>

                    <hr className="w-100 me-5" />

                    <div className="d-flex w-100 justify-content-start ms-5">
                        <ul className="navbar-nav flex-row">
                            <li className="nav-item me-3">
                                <Link to="/" className="navbar-brand enlaces-navbar">
                                    Nueva Comunidad
                                </Link>
                            </li>
                            <li className="nav-item">
                                <Link to="/" className="navbar-brand enlaces-navbar">
                                    Ayuda
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>
            </nav>
        </header>
    );
};

export default Header;