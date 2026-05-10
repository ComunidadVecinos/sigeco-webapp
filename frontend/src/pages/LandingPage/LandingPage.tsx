//Página acceso pública: presenta SIGECO, con tarjetas de características y CTA de regsitro
import React, {useEffect} from 'react';
import Footer from '../../components/common/Footer/Footer';
import FeatureCard from '../../components/ui/FeatureCard/FeatureCard';  
import logo from '../../assets/images/1.png';
import {Link} from 'react-router-dom';
import vecindarioImg from '../../assets/images/vecindario.png';
import touchIcon from '../../assets/images/touch.png';
import { Button } from '@/components/ui/button';

const LandingPage: React.FC = () =>{

    //Fuerza el scroll al inicio cada vez que se monta la página
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <>
            {/*Barra superior con logo y botón de acceso*/}
            <header>
                <nav className="flex items-center justify-between px-6 py-3 bg-white shadow-sm">
                        <Link to="/">
                            <img src={logo} alt="Sigeco" className="w-36" />
                        </Link>

                        <Button asChild className="bg-[#104084] hover:bg-[#0d3366] px-7 py-5 text-base font-semibold rounded-lg shadow-md hover:-translate-y-0.5 transition-all">
                            <Link to="/access">
                                <strong>Acceso</strong>
                            </Link>
                        </Button>
                </nav>  
            </header>

            {/*Contenido principal: hero, tarjetas de valor, sección ¿Por qué SIGECO? y CTA de registro*/}
            <main> 
                {/*Hero: título, descripción de la plataforma e imagen de vecindario*/}
                <section className="bg-gradient-to-br from-gray-50 to-gray-200 pt-28 pb-16 min-h-[70vh]">
                    <div className="max-w-7xl mx-auto px-4">
                        <div className="flex flex-col lg:flex-row items-center">
                            <div className="w-full lg:w-1/2 text-center lg:text-left">
                                <h1 className="text-[clamp(32px,5vw,56px)] leading-tight text-gray-900 font-bold mb-4">
                                    De la puerta del portal, <span className='text-[#104084]'>¡al portal digital!</span>
                                </h1>
                                <p className="text-lg leading-relaxed text-gray-600">
                                    El <em>ágora</em> digital diseñada para todos. Simplifica la convivencia con SIGECO, el Sistema de Gestión de Comunidades que permite desde el parte de averías, 
                                    hasta la gestión del día a día.
                                </p>
                                <p className="text-lg leading-relaxed text-gray-600">
                                    Conecta con tu comunidad y centraliza incidencias, anuncios, foros, reservas, votaciones y documentos en un entorno seguro.
                                </p>
                                <p className="text-xl text-[#104084] mt-5">
                                    <strong>La Gestion Comunitaria, al alcance de todos</strong>
                                </p>
                            </div>
                            <div className="w-full lg:w-1/2 text-center mt-10 lg:mt-0">
                                <img src={vecindarioImg} alt="vecindario" className="max-w-full lg:max-w-[80%] mx-auto rounded-2xl shadow-xl" />
                            </div>
                        </div>
                    </div>
                </section> 

                {/*Tarjetas de propuesta de valor: Simplicidad, Conexión y Transparencia*/}
                <section className="py-24 bg-white">         
                    <div className="max-w-7xl mx-auto px-4 flex justify-center flex-wrap gap-8">
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

                {/*Sección informativa: argumentos de por qué usar SIGECO*/}
                <section className='py-20 bg-gradient-to-b from-gray-50 to-white'>
                    <div className="max-w-3xl mx-auto px-4 text-center">
                        <h2 className='text-4xl sm:text-3xl font-bold text-gray-900 tracking-tight'>¿Por qué SIGECO?</h2>
                        <p className='text-lg text-gray-600 leading-relaxed mt-4'>Porque la gestión de comunidades modernas necesita algo más que correos y hojas de cálculo.</p>
                        <p className='text-lg text-gray-600 leading-relaxed'>SIGECO reúne comunicación, decisiones y documentación en un entorno claro, trazable y seguro.
                            Vecinos y administradores comparten la misma información, con permisos, históricos y procesos que transforman cada acción en transparencia.
                        </p>
                        <p className='text-xl font-semibold text-[#104084] mt-6'>Menos tiempo, menos conflictos, más comunidad.</p>  
                    </div>
                </section>

                {/*CTA: botón de regsitro*/}
                <section className="text-center py-10 pb-20">
                    <Button asChild size="lg" className='bg-[#104084] hover:bg-[#0d3366] px-12 py-7 text-lg font-semibold rounded-xl hover:-translate-y-1 transition-all hover:shadow-lg'>
                        <Link to="/auth/register">
                        Registrarme
                    </Link>
                    </Button>
                </section>
            </main>
            
            {/*Pie de página*/}
            <Footer />
        </>
    );
};

export default LandingPage;