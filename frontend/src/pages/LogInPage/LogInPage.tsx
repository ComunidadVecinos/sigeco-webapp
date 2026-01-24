import React, {useState} from 'react';
import {Link} from 'react-router-dom';
import logo from '../../assets/images/6.png';

const LogInPage: React.FC = () => {
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
                            <img src={logo} alt="Sigeco" className="img-logo1" />
                        </Link>
                    </div>
                </nav>
            </header>

            <main className="container">
                <h1 className="text-center"><strong>Iniciar Sesión</strong></h1>
                <hr className="mx-auto w-26 hr-grueso" />
                <div className="contorno row d-flex justify-content-center mt-3">
                    <h4 className="sub-title text-center mb-5">¡Bienvenido/a de nuevo! Accede con tu email/teléfono y contraseña para continuar donde lo dejaste.</h4>
                    <div className="row">
                        <div className="formulario mb-3 mt-2">
                            <label htmlFor="" className='form-label'>Introduce email o teléfono móvil</label> <br />
                            <input type="text" className='form-control' id='email' placeholder='correo@ucm.es'/>
                        </div>
                    </div>
                    <div className="row">
                        <div className="formulario mb-3 mt-2">
                            <label htmlFor="" className='form-label'>Contraseña</label> <br />
                            <div className="position-relative">
                                <input type="password" className='form-control' id='password' placeholder='********'/>
                                <span className="position-absolute end-0 top-50 translate-middle-y me-3" style={{cursor: 'pointer'}}>
                                    <svg xmlns="http://www.w3.org/2000/svg"
                                     viewBox="0 0 576 512" 
                                     style={{width: '20px', fill: '#6c757d'}}>
                                     <path d="M288 32c-80.8 0-145.5 36.8-192.6 80.6-46.8 43.5-78.1 95.4-93 131.1-3.3 7.9-3.3 16.7 0 24.6 14.9 35.7 46.2 87.7 93 131.1 47.1 43.7 111.8 80.6 192.6 80.6s145.5-36.8 192.6-80.6c46.8-43.5 78.1-95.4 93-131.1 3.3-7.9 3.3-16.7 0-24.6-14.9-35.7-46.2-87.7-93-131.1-47.1-43.7-111.8-80.6-192.6-80.6zM144 256a144 144 0 1 1 288 0 144 144 0 1 1 -288 0zm144-64c0 35.3-28.7 64-64 64-11.5 0-22.3-3-31.7-8.4-1 10.9-.1 22.1 2.9 33.2 13.7 51.2 66.4 81.6 117.6 67.9s81.6-66.4 67.9-117.6c-12.2-45.7-55.5-74.8-101.1-70.8 5.3 9.3 8.4 20.1 8.4 31.7z"/>
                                    </svg>
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className='row mt-4'>
                        <Link className='mb-5' to="/api/auth/reset-password">¿Olvidaste tu contraseña?</Link>
                    </div>
                </div>
            </main>

            <footer className='register-footer'>
                <Link to="/api/auth/forum" className="btn btn-primary mb-3">
                    <strong>Iniciar Sesión</strong>
                </Link>
                <div className='mt-3'>
                    Si tienes un código pero todavía no te has registrado, <Link to="/api/auth/register">hazlo aquí</Link>
                </div>
            </footer>
        </div>
    );
};

export default LogInPage;