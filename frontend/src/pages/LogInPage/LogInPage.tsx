import React, {useState} from 'react';
import {Link} from 'react-router-dom';
import logo from '../../assets/images/6.png';
import './LogInPage.css'


const LogInPage: React.FC = () => {
    const [metodoSeleccionado, setMetodoSeleccionado] = useState<string>('');

    const handleMetodoChange = (metodo: string) => {
        setMetodoSeleccionado(metodo);
    };

    return (

                <div className="login-container">
                    <div className="login-card">
                        <h1 className="login-title">Iniciar Sesión</h1>
                        <p className="login-subtitle">¡Bienvenido/a de nuevo!</p>

                        <form action="" className="login-form">
                            <div className="mb-3">
                                <label htmlFor="" className="form-label">Email o teléfono</label>
                                <input type="text" className="form-control" placeholder='correo@ucm.es' />
                            </div>

                            <div className="mb-3">
                                <label htmlFor="" className="form-label">Contraseña</label>
                                <input type="password" className="form-control" placeholder='********' />
                            </div>

                            <div className="login-forgot">
                                <Link to="/api/auth/reset-password">¿Olvidaste tu contraseña?</Link>
                            </div>

                            <Link to="/api/auth/forum" className="btn btn-primary login-btn">Iniciar Sesión</Link>

                        </form>

                        <p className="login-register">
                            ¿No tienes cuenta? <Link to="/api/auth/register">Regístrate aquí</Link>
                        </p>
                    </div>
                </div>

    );
};

export default LogInPage;