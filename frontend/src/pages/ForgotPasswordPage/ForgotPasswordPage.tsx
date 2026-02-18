import React, {useState} from 'react';
import {Link} from 'react-router-dom';
import './ForgotPasswordPage.css';
import { resetPassword } from '../../services/authServices';

const ForgotPassword: React.FC = () => {
    const [email, setEmail] = useState('');
    const [error, setError] = useState<string | undefined>();
    const [touched, setTouched] = useState(false);
    const [enviado, setEnviado] = useState(false);

    //Validar email
    const validateEmail = (value: string): string | undefined => {
        if(!value.trim()) return 'El email es requerido';
        if(!value.endsWith('@ucm.es')) return 'El email debe ser @ucm.es';
        return undefined;
    };

    //Manejar blur
    const handleBlur = () =>{
        setTouched(true);
        setError(validateEmail(email));
    };

    //Manejar submit
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setTouched(true);

        const emailError  = validateEmail(email);
        setError(emailError);

        if(!emailError){
            try{
                await resetPassword(email);
                setEnviado(true);
            }
            catch (error: any) {
                setError(error.response?.data?.message || 'Error al enviar el email');
            }
        }
    };

    const isFormValid = !validateEmail(email);

    if(enviado){
        return(
            <div className="forgot-container">
                <div className="forgot-card text-center">
                    <h1 className="forgot-title">¡Email enviado!</h1>
                    <p className="forgot-subtitle">Hemos enviado una contraseña temporal a <strong>{email}</strong>. <br /> Revisa tu bandeja de entrada.</p>
                    <Link to="/auth/login" className="btn btn-primary forgot-btn">Volver a iniciar sesión</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="forgot-container">
            <div className="forgot-card">
                <h1 className="forgot-title">Olvidé mi contraseña</h1>
                <p className="forgot-subtitle">
                    Introduce tu email y te enviaremos una contraseña temporal.
                    Te recomendamos cambiarla desde tu perfil una vez que accedas.
                </p>

                <form action="" className="forgot-form" onSubmit={handleSubmit}>
                    <div className="mb-3">
                        <label htmlFor="" className="form-label">Email</label>
                        <input type="email" className={`form-control ${touched ? (error ? 'is-invalid' : 'is-valid') : ''}` } placeholder='correo@ucm.es' value={email} onChange={(e) => setEmail(e.target.value)} onBlur={handleBlur}/>
                        {touched && error && <div className='invalid-feedback'>{error}</div>}
                    </div>

                    <button type='submit' className="btn btn-primary forgot-btn" disabled={!isFormValid}>Enviar</button>
                </form>

                <p className="forgot-back">
                    <Link to="/auth/login">Volver a iniciar sesión</Link>
                </p>
            </div>
        </div>
    );
};

export default ForgotPassword;