import React, {useState} from 'react';
import {Link} from 'react-router-dom';
import logo from '../../assets/images/6.png';
import './ForgotPasswordPage.css';

const ForgotPassword: React.FC = () => {
    const [metodoSeleccionado, setMetodoSeleccionado] = useState<string>('');

    const handleMetodoChange = (metodo: string) => {
        setMetodoSeleccionado(metodo);
    };

    return (
        <div className="forgot-container">
            <div className="forgot-card">
                <h1 className="forgot-title">Olvidé mi contraseña</h1>
                <p className="forgot-subtitle">
                    Introduce tu email y te enviaremos una contrasela temporal.
                    Te recomendamos cambiarla desde tu perfil una vez que accedas.
                </p>

                <form action="" className="forgot-form">
                    <div className="mb-3">
                        <label htmlFor="" className="form-label">Email</label>
                        <input type="email" className="form-control" placeholder='correo@ucm.es'/>
                    </div>

                    <button className="btn btn-primary forgot.btn">Enviar</button>
                </form>

                <p className="forgot-back">
                    <Link to="/api/auth/login">Volver a iniciar sesión</Link>
                </p>
            </div>
        </div>
    );
};

export default ForgotPassword;