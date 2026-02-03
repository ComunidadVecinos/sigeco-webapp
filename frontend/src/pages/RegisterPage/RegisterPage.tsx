import React, {useState} from 'react';
import {Link} from 'react-router-dom';
import logo from '../../assets/images/6.png';
import './RegisterPage.css';

const RegisterPage: React.FC = () => {
    const [metodoSeleccionado, setMetodoSeleccionado] = useState<string>('');

    const handleMetodoChange = (metodo: string) => {
        setMetodoSeleccionado(metodo);
    };

    return (
        <div className="register-container">
            <div className="register-card">
                <h1 className="register-title">Registrar una nueva cuenta</h1>
                <p className="register-subtitle">¡Únete ahora! Crea tu cuenta en segundos</p>

                <form action="" className="register-form">
                    <div className="row">
                        <div className="col-12 col-md-5 mb-3">
                            <label htmlFor="" className="form-label">Nombre</label>
                            <input type="text" className="form-control" placeholder='María'/>
                        </div>
                        <div className="col-12 col-md-7 mb-3">
                            <label htmlFor="" className="form-label">Apellidos</label>
                            <input type="text" className="form-control" placeholder='Pérez Gómez'/>
                        </div>
                    </div>

                    <div className="row">
                        <div className="col-12 col-md-8 mb-3">
                            <label htmlFor="" className="form-label">Correo electrónico</label>
                            <input type="email" className="form-control" placeholder='correo@ucm.es'/>
                        </div>
                        <div className="col-12 col-md-4 mb-3">
                            <label htmlFor="" className="form-label">Teléfono</label>
                            <input type="tel" className="form-control" placeholder='+34'/>
                        </div>
                    </div>

                    <div className="mb-3">
                        <label htmlFor="" className="form-label">Contraseña</label>
                        <input type="password" className="form-control" placeholder='********'/>
                    </div>

                    <div className="mb-3">
                        <label htmlFor="" className="form-label">Repetir Contraseña</label>
                        <input type="password" className="form-control" placeholder='********'/>
                    </div>

                    <Link to="/api/auth/me" className='btn btn-primary register-btn'>Registrarme</Link>
                </form>

                <p className="register-login">
                    ¿Ya tienes cuenta? <Link to="/api/auth/login">Inicia sesión aquí</Link>
                </p>
            </div>
        </div>
    );
};

export default RegisterPage;