//Pagina de bienvenida donde puedes registrarte o iniciar sesion

import React from "react";

import imgSD from '../../assets/images/SwingingDoodle.png'
import logo from '../../assets/images/6.png'

const WelcomePage: React.FC = () => {
    return (
        <div>
            <header>
                <nav className="navbar bg-white">
                    <div className="container-fluid">
                        <a className="navbar-brand"><img className="img-logo1" src={logo} alt="Sigeco"/> </a>
                    </div>
                </nav>
            </header>

            <main>
                <h1 className="text-center mt-4"><strong>¡Bienvenido/a a SIGECO!</strong></h1>
                <div className="imagen text-center mt-4">
                    <img src={imgSD} alt="ilustracion-bienvenida"/>
                </div>
            
                <div className="text-center mt-5 mb-5 ">
                    <a type="button" className="btn btn-primary btn-lg mx-5" href="registro.html">Registrarme</a>
                    <a type="button" className="btn btn-primary btn-lg mx-5" href="inicio-sesion.html">Iniciar Sesión</a>
                </div>
                    
                <div className="text-center">
                    <p>El Sistema de Gestion Comunitaria que digitaliza la comunicación, la documentación y la toma de decisiones.</p>
                </div>
                
            </main>

        </div>
    );
};

export default WelcomePage;