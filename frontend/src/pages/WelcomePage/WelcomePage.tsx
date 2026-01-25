//Pagina de bienvenida donde puedes registrarte o iniciar sesion

import React from "react";

import imgSD from '../../assets/images/SwingingDoodle.png'
import logo from '../../assets/images/6.png'
import {Link} from 'react-router-dom';

const WelcomePage: React.FC = () => {
    return (
        <div>
            <header>
                <nav className="navbar bg-white">
                    <div className="container-fluid">
                        <Link to="/" className="navbar-brand">
                            <img src={logo} alt="Sigeco" className="img-logo1" />
                        </Link>
                    </div>
                </nav>
            </header>

            <main>
                <h1 className="text-center mt-4"><strong>¡Bienvenido/a a SIGECO!</strong></h1>
                <div className="imagen text-center mt-4">
                    <img src={imgSD} alt="ilustracion-bienvenida"/>
                </div>
            
                <div className="text-center mt-5 mb-5 ">
                    <Link to="/api/auth/register" className="btn btn-primary btn-lg mx-5">
                            <strong>Registrarme</strong>
                    </Link>
                    <Link to="/api/auth/login" className="btn btn-primary btn-lg mx-5">
                            <strong>Iniciar Sesión</strong>
                    </Link>
                </div>
                    
                <div className="text-center">
                    <p className="parrafo">El Sistema de Gestion Comunitaria que digitaliza la comunicación, la documentación y la toma de decisiones.</p>
                </div>
                
            </main>

        </div>
    );
};

export default WelcomePage;