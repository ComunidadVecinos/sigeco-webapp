import React, {useState} from 'react';
import {Link, useNavigate} from 'react-router-dom';
import { useAuth } from '../../context/authContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';   


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
    const {login} = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setTouched({email: true, password: true});

        if(validateForm()){
            try{
                await login(email, password);
                navigate('/auth/me');
            }
            catch(error: any){
                setErrors({email: 'Credenciales incorrectas'});
            }
        }
    };

    const isFormValid = !validateEmail(email) && !validatePassword(password);

    return (
        <div className="min-h-screen flex items-center justify-center px-5 py-12 bg-gradient-to-br from-gray-50 to-gray-200">
            <div className="bg-white rounded-2xl shadow-lg p-10 w-full max-w-md">
                <h1 className="text-3xl font-bold text-center mb-2">Iniciar Sesión</h1>
                <p className="text-sm text-muted-foreground text-center mb-8">¡Bienvenido/a de nuevo!</p>

                <form className="space-y-4" onSubmit={handleSubmit}>
                    <div className="space-y-2">
                        <Label>Email o teléfono</Label>
                        <Input 
                            type="text" 
                            className={touched.email ? (errors.email ? 'border-red-500' : 'border-green-500') : ''}
                            placeholder='correo@ucm.es' 
                            value={email} 
                            onChange={(e) => setEmail(e.target.value)} 
                            onBlur={() => handleBlur('email')} 
                        />
                        {touched.email && errors.email && (<div className='text-sm text-red-500'>{errors.email}</div>)}
                    </div>

                    <div className="space-y-2">
                        <Label>Contraseña</Label>
                        <Input 
                            type="password" 
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