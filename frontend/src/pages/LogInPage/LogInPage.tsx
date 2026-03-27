import React, {useState} from 'react';
import {Link, useNavigate} from 'react-router-dom';
import { useAuth } from '../../context/authContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';   


const LogInPage: React.FC = () => {

    const navigate = useNavigate();

    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState<{identifier?: string; password?: string}>({});
    const [touched, setTouched] = useState<{identifier?: boolean; password?: boolean}>({});

    //Validar identificador
    const validateIdentifier = (value: string): string | undefined => {
        if(!value.trim()) return 'El email o teléfono es requerido';

        const normalized = value.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const phoneRegex = /^\d{9}$/;

        if(emailRegex.test(normalized)) return undefined;
        if(phoneRegex.test(normalized.replace(/\s/g, ''))) return undefined;

        return 'Introduce un email válido o un teléfono de 9 dígitos';
    };

    //Validar contraseña
    const validatePassword = (value: string): string | undefined => {
        if(!value) return 'La contraseña es requerida';
        return undefined;
    };

    //Validar todo el formulario
    const validateForm = (): boolean =>{
        const identifierError = validateIdentifier(identifier);
        const passwordError = validatePassword(password);
        setErrors({identifier: identifierError, password: passwordError});
        return !identifierError && !passwordError;
    };

    //Manejar blur
    const handleBlur = (field: 'identifier' | 'password') => {
        setTouched({ ...touched, [field]: true});
        if(field === 'identifier'){
            setErrors({ ...errors, identifier: validateIdentifier(identifier)});
        }
        else{
            setErrors({ ...errors, password: validatePassword(password)});
        }
    };

    //Manejar envio
    const {login} = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setTouched({identifier: true, password: true});

        if(validateForm()){
            try{
                await login(identifier, password);
                navigate('/auth/me');
            }
            catch(error: any){
                setErrors({identifier: error.response?.data?.error?.message || 'Credenciales incorrectas'});
            }
        }
    };

    const isFormValid = !validateIdentifier(identifier) && !validatePassword(password);

    return (
        <div className="min-h-screen flex items-center justify-center px-5 py-12 bg-gradient-to-br from-gray-50 to-gray-200">
            <div className="bg-white rounded-2xl shadow-lg p-10 w-full max-w-md">
                <h1 className="text-3xl font-bold text-center mb-2">Iniciar Sesión</h1>
                <p className="text-sm text-muted-foreground text-center mb-8">¡Bienvenido/a de nuevo!</p>

                <form className="space-y-4" onSubmit={handleSubmit} autoComplete="off">
                    <div className="space-y-2">
                        <Label htmlFor="login-identifier">Email o teléfono</Label>
                        <Input 
                            id="login-identifier"
                            name="identifier"
                            type="text" 
                            autoComplete="username"
                            className={touched.identifier ? (errors.identifier ? 'border-red-500' : 'border-green-500') : ''}
                            placeholder='correo@ucm.es' 
                            value={identifier} 
                            onChange={(e) => setIdentifier(e.target.value)} 
                            onBlur={() => handleBlur('identifier')} 
                        />
                        {touched.identifier && errors.identifier && (<div className='text-sm text-red-500'>{errors.identifier}</div>)}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="login-password">Contraseña</Label>
                        <Input 
                            id="login-password"
                            name="password"
                            type="password" 
                            autoComplete="current-password"
                            className={touched.password ? (errors.password ? 'border-red-500' : 'border-green-500') : ''} 
                            placeholder='********' 
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)} 
                            onBlur={() => handleBlur('password')} 
                        />
                        {touched.password && errors.password && (<div className='text-sm text-red-500'>{errors.password}</div>)}
                    </div>

                    <div className="text-right">
                        <Link to="/auth/reset-password" className='text-sm text-primary hover:underline'>¿Olvidaste tu contraseña?</Link>
                    </div>

                    <Button type='submit' className="w-full py-6 text-base font-semibold rounded-xl" disabled={!isFormValid}>Iniciar Sesión</Button>

                </form>

                <p className="text-center text-sm text-muted-foreground mt-5">
                    ¿No tienes cuenta? <Link to="/auth/register" className='text-primary font-medium hover:underline'>Regístrate aquí</Link>
                </p>
            </div>
        </div>

    );
};

export default LogInPage;
