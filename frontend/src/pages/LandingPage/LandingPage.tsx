//El componente que contendra todo el diseño

import React from 'react';

import Header from '../../components/common/Header/Header';
import Footer from '../../components/common/Footer/Footer';
import FeatureCard from '../../components/ui/FeatureCard/FeatureCard';  

import vecindarioImg from '../../assets/images/vecindario.png';
import touchIcon from '../../assets/images/touch.png';

const LandingPage: React.FC = () =>{
    return (
        <>
            <Header />
            <main> 
                <div className="container mb-5">
                    <div className="row">
                        <div className="col-md-6 col-12 mt-4">
                            <h1 className="title mb-4">
                                <strong>De la puerta del portal, ¡al portal digital!</strong>
                            </h1>
                            <p className="parrafo-inicial">
                                El <em>ágora</em> digital diseñada para todos. Simplifica la convivencia con SIGECO, el Sistema de Gestión de Comunidades que permite desde el parte de averías, 
                                hasta la gestión del día a día. <br /> <br />
                                Conecta con tu comunidad y centraliza incidencias, anuncios, foros, reservas, votaciones y documentos en un entorno seguro.
                            </p>
                            <p className="sub-parrafo">
                                <strong>La Gestion Comunitaria, al alcance de todos</strong>
                            </p>
                        </div>
                        <div className="col-6">
                            <img src={vecindarioImg} alt="vecindario" className="img-fluid" />
                        </div>
                    </div>
                </div>

                <div className="container d-flex justify-content-center flex-wrap gap-4">
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

                <div className="container3 text-center mt-5">
                    <h2><strong>¿Por qué SIGECO?</strong></h2>
                    <p>Porque la gestión de comunidades modernas necesita algo más que correos y hojas de cálculo.</p>
                    <p>SIGECO reúne comunicación, decisiones y documentación en un entorno claro, trazable y seguro.
                        Vecinos y administradores comparten la misma información, con permisos, históricos y procesos que transforman cada acción en
                        transparencia.
                    </p>
                    <p><strong>Menos tiempo, menos conflictos, más comunidad.</strong></p>  
                </div>

                <div className="text-center mt-5 mb-5">
                    <button className="btn btn-primary registrarme" type="button" onClick={() => console.log('Navegar a Registro')}>
                        Registrarme
                    </button>
                </div>

            </main>
            <Footer />
        </>
    );
};

export default LandingPage;