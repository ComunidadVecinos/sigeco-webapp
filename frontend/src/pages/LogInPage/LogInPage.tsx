import React, {useState} from 'react';
import {Link, useNavigate} from 'react-router-dom';
import logo from '../../assets/images/6.png';
import './LogInPage.css'


const LogInPage: React.FC = () => {

    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState<{email?: string; password?: string}>({});
    const [touched, setTouched] = useState<{email?: boolean; password?: boolean}>({});

    //Validar email
    const validateEmail = (value: string): string | undefined => {
        if(!value.trim()) return 'El email es requerido';
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if(!emailRegex.test(value)) return 'Formato de email inválido';
        return undefined;
    };

    //Validar contraseña
    const validatePassword = (value: string): string | undefined => {
        if(!value) return 'La contraseña es requerida';
        return undefined;
    };

    //Validar todo el formulario
    const validateForm = (): boolean =>{
        const emailError = validateEmail(email);
        const passwordError = validatePassword(password);
        setErrors({email: emailError, password: passwordError});
        return !emailError && !passwordError;
    };

    //Manejar blur
    const handleBlur = (field: 'email' | 'password') => {
        setTouched({ ...touched, [field]: true});
        if(field === 'email'){
            setErrors({ ...errors, email: validateEmail(email)});
        }
        else{
            setErrors({ ...errors, password: validatePassword(password)});
        }
    };

    //Manejar envio
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setTouched({email: true, password: true});

        if(validateForm()){
            navigate('/api/auth/forum');
        }
    };

    const isFormValid = !validateEmail(email) && !validatePassword(password);

    return (
        <div className="login-container">
            <div className="login-card">
                <h1 className="login-title">Iniciar Sesión</h1>
                <p className="login-subtitle">¡Bienvenido/a de nuevo!</p>

                <form action="" className="login-form" onSubmit={handleSubmit}>
                    <div className="mb-3">
                        <label htmlFor="" className="form-label">Email o teléfono</label>
                        <input type="text" className={`form-control ${touched.email ? (errors.email ? 'is-invalid' : 'is-valid') : ''}`} placeholder='correo@ucm.es' value={email} onChange={(e) => setEmail(e.target.value)} onBlur={() => handleBlur('email')} />
                        {touched.email && errors.email && (<div className='invalid-feedback'>{errors.email}</div>)}
                    </div>

                    <div className="mb-3">
                        <label htmlFor="" className="form-label">Contraseña</label>
                        <input type="password" className={`form-control ${touched.password ? (errors.password ? 'is-invalid' : 'is-valid') : ''}`} placeholder='********' value={password} onChange={(e) => setPassword(e.target.value)} onBlur={() => handleBlur('password')} />
                        {touched.password && errors.password && (<div className='invalid-feedback'>{errors.password}</div>)}
                    </div>

                    <div className="login-forgot">
                        <Link to="/api/auth/reset-password">¿Olvidaste tu contraseña?</Link>
                    </div>

                    <button type='submit' className="btn btn-primary login-btn" disabled={!isFormValid}>Iniciar Sesión</button>

                </form>

                <p className="login-register">
                    ¿No tienes cuenta? <Link to="/api/auth/register">Regístrate aquí</Link>
                </p>
            </div>
        </div>

    );
};

export default LogInPage;