import React, {useState} from 'react';
import {Link} from 'react-router-dom';
import logo from '../../assets/images/6.png';

const RegisterPage: React.FC = () => {
    const [metodoSeleccionado, setMetodoSeleccionado] = useState<string>('');

    const handleMetodoChange = (metodo: string) => {
        setMetodoSeleccionado(metodo);
    };

    return (
        <div>
            <header>
                <nav className="navbar bg-white">
                    <div className="container-fluid">
                        <Link to="/" className="navbar-brand">
                            <img src="{logo}" alt="Sigeco" className="img-logo1" />
                        </Link>
                    </div>
                </nav>
            </header>

            <main className="container">
                <h1 className="text-center"><strong>Registrar una nueva cuenta</strong></h1>
                <hr className="mx-auto w-26 hr-grueso" />
                <div className="contorno row d-flex justify-content-center mt-5">
                    <h2 className="sub-title">¡Unete ahora! Crea tu cuenta en segundos y descubre todo lo que tenemos para ti</h2>
                    
                    <div className="row">
                        
                    </div>
                    <div className="row">

                    </div>
                    <div className="row">

                    </div>
                    <div className="row">

                    </div>
                </div>
            </main>
        </div>
    );
};