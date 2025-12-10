//La barra de navegacion con el logo y el boton de acceso

import React from 'react';
import logo from '../../../assets/images/1.png';

const Header: React.FC = () =>{
    return(
        <header>
            <nav className="navbar bg-body-tertiary">
                <div className="container-fluid">
                    <a href="/" className="navbar-brand">
                    <img src={logo} alt="Sigeco" className="img-logo" />
                    </a>

                    <form className="d-flex" role="search">
                        <a href="/acceso" className="btn">
                            <strong>Acceso</strong>
                        </a>
                    </form>
                </div>
            </nav>  
        </header>
    );
};

export default Header;