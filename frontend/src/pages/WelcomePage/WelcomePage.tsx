//Pagina de bienvenida donde puedes registrarte o iniciar sesion

import React from "react";

import imgSD from '../../assets/images/SwingingDoodle.png'
import logo from '../../assets/images/6.png'
import {Link} from 'react-router-dom';
import './WelcomePage.css';

const WelcomePage: React.FC = () => {
    return (
        <div>


            <main>
                <div className="welcome-container">
                    <h1 className="welcome-title">¡Bienvenido/a a SIGECO!</h1>

                    <div className="welcome-image">
                        <img src={imgSD} alt="ilustracion-bienvenida"/>
                    </div>
                
                    <div className="welcome-buttons">
                        <Link to="/api/auth/register" className="btn btn-primary">
                            Registrarme
                        </Link>
                        <Link to="/api/auth/login" className="btn btn-primary">
                            Iniciar Sesión
                        </Link>
                    </div>
                        
                    <p className="welcome-description">
                        El Sistema de Gestion Comunitaria que digitaliza la comunicación, la documentación y la toma de decisiones.
                    </p>
                </div>
            </main>

        </div>
    );
};

export default WelcomePage;