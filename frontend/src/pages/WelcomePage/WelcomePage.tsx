//Pagina de bienvenida pública donde puedes registrarte o iniciar sesion
import React, { useEffect } from "react";
import {Button} from "@/components/ui/button";
import imgSD from '../../assets/images/SwingingDoodle.png'
import {Link, useNavigate} from 'react-router-dom';
import { useAuth } from '@/context/authContext';

const WelcomePage: React.FC = () => {
    const navigate = useNavigate();
    const { user, loading } = useAuth();

    //Si el usuario ya tiene sesión, redirige al perfil automáticamente
    useEffect(() => {
        if (!loading && user) {
            navigate('/auth/me', { replace: true });
        }
    }, [loading, navigate, user]);

    return (
        <div>
            <main>
                <div className="min-h-screen flex flex-col items-center justify-center px-5 py-24 bg-gradient-to-br from-gray-50 to-gray-200">
                    <h1 className="text-4xl sm:text-3xl font-bold text-gray-900 mb-8">¡Bienvenido/a a SIGECO!</h1>

                    <div className="mb-10">
                        <img src={imgSD} alt="ilustracion-bienvenida" className="max-w-[350px] sm:max-w-[250px]"/>
                    </div>
                
                    {/*Botones de acceso: registro e inicio de sesión*/}
                    <div className="flex flex-col sm:flex-row gap-5 mb-8">
                        <Button asChild size="lg" className="px-10 py-6 text-base rounded-xl">
                            <Link to="/auth/register">
                                Registrarme
                            </Link>
                        </Button>
                        <Button asChild size="lg" className="px-10 py-6 text-base rounded-xl">
                            <Link to="/auth/login">
                                Iniciar Sesión
                            </Link>
                        </Button>
                    </div>
                        
                    <p className="text-base text-muted-foreground max-w-md text-center">
                        El Sistema de Gestion Comunitaria que digitaliza la comunicación, la documentación y la toma de decisiones.
                    </p>
                </div>
            </main>

        </div>
    );
};

export default WelcomePage;
