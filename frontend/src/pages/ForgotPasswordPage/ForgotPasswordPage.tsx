import React, {useState} from 'react';
import {Link} from 'react-router-dom';
import { resetPassword } from '@/services/authServices';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getApiErrorMessage, getApiFieldErrors } from '@/lib/formErrors';

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
                const fieldErrors = getApiFieldErrors(error, { email: 'email' });
                setError(fieldErrors.email || getApiErrorMessage(error, 'No se ha podido enviar la contraseña temporal.'));
            }
        }
    };

    const isFormValid = !validateEmail(email);

    if(enviado){
        return(
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-200 px-4">
                <div className="bg-white rounded-2xl shadow-lg p-10 max-w-md w-full text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">¡Email enviado!</h1>
                    <p className="text-muted-foreground mb-6">Hemos enviado una contraseña temporal a <strong>{email}</strong>. <br /> Revisa tu bandeja de entrada.</p>
                    <Button asChild className='w-full'>
                        <Link to="/auth/login">Volver a iniciar sesión</Link>
                    </Button>
                    
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-200 px-4">
            <div className="bg-white rounded-2xl shadow-lg p-10 max-w-md w-full">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Olvidé mi contraseña</h1>
                <p className="text-muted-foreground mb-6">
                    Introduce tu email y te enviaremos una contraseña temporal.
                    Te recomendamos cambiarla desde tu perfil una vez que accedas.
                </p>

                <form className="space-y-4" onSubmit={handleSubmit}>
                    <div className="space-y-2">
                        <Label>Email</Label>
                        <Input type="email" className={touched ? (error ? 'border-red-500' : 'border-green-500') : ''} placeholder='correo@ucm.es' value={email} onChange={(e) => setEmail(e.target.value)} onBlur={handleBlur}/>
                        {touched && error && <p className='text-sm text-red-500'>{error}</p>}
                    </div>

                    <Button type='submit' className="w-full" disabled={!isFormValid}>Enviar</Button>
                </form>

                <p className="text-center text-sm text-muted-foreground mt-4">
                    <Link to="/auth/login" className='text-primary hover:underline'>Volver a iniciar sesión</Link>
                </p>
            </div>
        </div>
    );
};

export default ForgotPassword;
