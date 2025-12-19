//La barra de navegacion con el logo y el boton de acceso

import React from 'react';
import logo from '../../../assets/images/1.png';
import {Link} from 'react-router-dom';

const Header: React.FC = () =>{
    return(
        <header>
            <nav className="navbar bg-body-tertiary">
                <div className="container-fluid">
                    <Link to="/" className="navbar-brand">
                        <img src={logo} alt="Sigeco" className="img-logo" />
                    </Link>

                    <form className="d-flex" role="search">
                        <Link to="/acceso" className="btn acceso">
                            <strong>Acceso</strong>
                        </Link>
                    </form>
                </div>
            </nav>  
        </header>
    );
};

export default Header;