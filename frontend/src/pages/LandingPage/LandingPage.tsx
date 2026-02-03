//El componente que contendra todo el diseño

import React from 'react';
import Footer from '../../components/common/Footer/Footer';
import FeatureCard from '../../components/ui/FeatureCard/FeatureCard';  
import logo from '../../assets/images/1.png';
import {Link} from 'react-router-dom';
import vecindarioImg from '../../assets/images/vecindario.png';
import touchIcon from '../../assets/images/touch.png';
import './LandingPage.css';

const LandingPage: React.FC = () =>{
    return (
        <>
            <header>
                <nav className="navbar bg-body-tertiary">
                    <div className="container-fluid">
                        <Link to="/" className="navbar-brand">
                            <img src={logo} alt="Sigeco" className="img-logo" />
                        </Link>

                        <form className="d-flex">
                            <Link to="/access" className="btn acceso">
                                <strong>Acceso</strong>
                            </Link>
                        </form>
                    </div>
                </nav>  
            </header>

            <main> 
                <section className="hero-section">
                    <div className="container">
                        <div className="row align-items-center">
                            <div className="col-lg-6 col-12">
                                <h1 className="title mb-4">
                                    De la puerta del portal, <span>¡al portal digital!</span>
                                </h1>
                                <p className="parrafo parrafo-inicial">
                                    El <em>ágora</em> digital diseñada para todos. Simplifica la convivencia con SIGECO, el Sistema de Gestión de Comunidades que permite desde el parte de averías, 
                                    hasta la gestión del día a día.
                                </p>
                                <p className="parrafo parrafo-inicial">
                                    Conecta con tu comunidad y centraliza incidencias, anuncios, foros, reservas, votaciones y documentos en un entorno seguro.
                                </p>
                                <p className="sub-parrafo">
                                    <strong>La Gestion Comunitaria, al alcance de todos</strong>
                                </p>
                            </div>
                            <div className="col-lg-6 col-12 text-center">
                                <img src={vecindarioImg} alt="vecindario" className="hero-image" />
                            </div>
                        </div>
                    </div>
                </section> 

                <section className="features-section">         
                    <div className="container d-flex justify-content-center flex-wrap gap-5">
                        <FeatureCard
                            title="Simplicidad"
                            subtitle="Una plataforma inclusiva e integral"
                            description="Menos correos, menos llamadas, menos fricción."
                            icon={touchIcon}
                        />
                        <FeatureCard
                            title="Conexión"
                            subtitle="Mas participación, menos conflictos"
                            description="Votaciones, Tablón de Noticias, Foro con reacciones y etiquetas."
                            icon={touchIcon}
                        />
                        <FeatureCard
                            title="Transparencia"
                            subtitle="¡Evitemos los rumores!"
                            description="Cada incidencia o acuerdo queda registrado y visible para todos."
                            icon={touchIcon}
                        />
                    </div>
                </section>

                <section className='why-section'>
                    <div className="container">
                        <div className="why-container">
                            <h2>¿Por qué SIGECO?</h2>
                            <p>Porque la gestión de comunidades modernas necesita algo más que correos y hojas de cálculo.</p>
                            <p>SIGECO reúne comunicación, decisiones y documentación en un entorno claro, trazable y seguro.
                                Vecinos y administradores comparten la misma información, con permisos, históricos y procesos que transforman cada acción en transparencia.
                            </p>
                            <p className='highlight'>Menos tiempo, menos conflictos, más comunidad.</p>  
                        </div>
                    </div>
                </section>

                <section className="cta-section">
                    <Link to="/api/auth/register" className="btn btn-primary registrarme">
                        Registrarme
                    </Link>
                </section>
            </main>

            <Footer />
        </>
    );
};

export default LandingPage;