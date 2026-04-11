import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/authContext';

const NotFoundPage: React.FC = () => {
    const { user } = useAuth();

    return (
        <main className="min-h-screen flex items-center justify-center px-5 py-12 bg-gradient-to-br from-gray-50 to-gray-200">
            <div className="bg-white rounded-2xl shadow-lg p-10 w-full max-w-xl text-center">
                <p className="text-sm font-semibold text-[#104084] mb-3">Error 404</p>
                <h1 className="text-3xl font-bold text-gray-900 mb-3">Página no encontrada</h1>
                <p className="text-sm text-muted-foreground mb-8">
                    La ruta a la que has intentado acceder no existe o ya no está disponible.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button asChild size="lg">
                        <Link to="/">Ir a la landing</Link>
                    </Button>
                    {user && (
                        <Button asChild size="lg" variant="outline">
                            <Link to="/auth/me">Volver a mi perfil</Link>
                        </Button>
                    )}
                </div>
            </div>
        </main>
    );
};

export default NotFoundPage;
