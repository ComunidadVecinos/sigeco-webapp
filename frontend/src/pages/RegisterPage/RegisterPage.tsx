import React, {useState} from 'react';
import {Link, useNavigate} from 'react-router-dom';
import {register} from '../../services/authServices';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';   

interface FormData {
    nombre: string;
    apellidos: string;
    email: string;
    telefono: string;
    password: string;
    confirmPassword: string;
}

interface FormErrors {
    nombre?: string;
    apellidos?: string;
    email?: string;
    telefono?: string;
    password?: string;
    confirmPassword?: string;
}

const RegisterPage: React.FC = () => {
    const navigate = useNavigate();

    const [formData, setFormData] = useState<FormData>({
        nombre: '',
        apellidos: '',
        email: '',
        telefono: '',
        password: '',
        confirmPassword: ''
    });

    const [errors, setErrors] = useState<FormErrors>({});
    const [touched, setTouched] = useState<Record<string, boolean>>({});

    //Validacion de nombre
    const validateNombre = (value: string):string | undefined => {
        if(!value.trim()) return 'El nombre es requerido';
        return undefined;
    };

    //Validacion de apellidos
    const validateApellidos = (value: string):string | undefined => {
        if(!value.trim()) return 'Los apellidos son requeridos';
        return undefined;
    };

    //Validacion de email
    const validateEmail = (value: string):string | undefined => {
        if(!value.trim()) return 'El email es requerido';
        if(!value.endsWith('@ucm.es')) return 'El email debe ser @ucm.es';
        return undefined;
    };

    //Validacion de telefono
    const validateTelefono = (value: string):string | undefined => {
        if(!value.trim()) return 'El teléfono es requerido';
        if(!/^[\d\s]+$/.test(value)) return 'El telefono solo puede contener dígitos y espacios';
        const soloNum = value.replace(/\s/g, '');
        if(soloNum.length !== 9) return 'El teléfono debe tener 9 dígitos';
        return undefined;
    };

    //Validacion de contraseña
    const validatePassword = (value: string):string | undefined => {
        if(!value.trim()) return 'El contraseña es requerida';
        if(value.length < 8) return 'Mínimo 8 caracteres';
        if(!/[A-Z]/.test(value)) return 'Debe contener al menos una mayúscula';
        if(!/[a-z]/.test(value)) return 'Debe contener al menos una minúscula';
        if(!/[0-9]/.test(value)) return 'Debe contener al menos una número';
        if(!/[!@#$%^&*(),.?":{}|<>]/.test(value)) return 'Debe contener un carácter especial (!@#$%^&*...)';
        return undefined;
    };

    //Validacion de confirmacion de contraseña
    const validateConfirmPassword = (value: string):string | undefined => {
        if(!value.trim()) return 'Debes repetir la contraseña';
        if(value !== formData.password) return 'Las contraseñas no coinciden';
        return undefined;
    };

    //Validar todo 
    const validateForm = (): boolean =>{
        const newErrors: FormErrors = {
            nombre: validateNombre(formData.nombre),
            apellidos: validateApellidos(formData.apellidos),
            email: validateEmail(formData.email),
            telefono: validateTelefono(formData.telefono),
            password: validatePassword(formData.password),
            confirmPassword: validateConfirmPassword(formData.confirmPassword)
        };
        setErrors(newErrors);
        return !Object.values(newErrors).some(error => error !== undefined);
    };

    //Manejar cambios
    const handleChange = (field: keyof FormData, value: string) => {
        setFormData({...formData, [field]: value});
    };

    //Manejar blur
    const handleBlur = (field: keyof FormData) => {
        setTouched({...touched, [field]: true});

        const validators: Record<keyof FormData, (v: string) => string | undefined> = {
            nombre: validateNombre,
            apellidos: validateApellidos,
            email: validateEmail,
            telefono: validateTelefono,
            password: validatePassword,
            confirmPassword: validateConfirmPassword
        };

        setErrors({...errors, [field]: validators[field](formData[field])});
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const allTouched: Record<string, boolean> = {};
        Object.keys(formData).forEach(key => allTouched[key] = true);
        setTouched(allTouched);

        if(validateForm()) {
            try {
                await register(formData.nombre, formData.apellidos, formData.email, formData.telefono, formData.password);
                navigate('/auth/login');
            }
            catch (error: any){
                const details = error.response?.data?.error?.details;
                if(Array.isArray(details)){
                    const fieldMap: Record<string, keyof FormErrors> = {
                        firstName: 'nombre',
                        lastName: 'apellidos',
                        email: 'email',
                        phone: 'telefono',
                        password: 'password',
                    };
                    const newErrors: FormErrors = {};
                    details.forEach((d: any) => {
                        const field = fieldMap[d.field];
                        if(field) newErrors[field] = d.message;
                    });
                    setErrors(newErrors);
                }
                else{
                    const msg = error.response?.data?.error?.message || 'Error al registrar';
                    setErrors({email: msg});
                }
            } 
        }
    };

    const isFormValid =
        !validateNombre(formData.nombre) && 
        !validateApellidos(formData.apellidos) && 
        !validateEmail(formData.email) && 
        !validateTelefono(formData.telefono) && 
        !validatePassword(formData.password) && 
        !validateConfirmPassword(formData.confirmPassword);


    return (
        <div className="min-h-screen flex items-center justify-center px-5 py-12 bg-gradient-to-br from-gray-50 to-gray-200">
            <div className="bg-white rounded-2xl shadow-lg p-10 sm:p-6 w-full max-w-xl">
                <h1 className="text-3xl font-bold text-center mb-2">Registrar una nueva cuenta</h1>
                <p className="text-sm text-muted-foreground text-center mb-8">¡Únete ahora! Crea tu cuenta en segundos</p>

                <form className="space-y-4" onSubmit={handleSubmit}>
                    <div className="flex flex-col md:flex-row gap-4">

                        <div className="space-y-2 w-full md:w-5/12">
                            <Label>Nombre</Label>
                            <Input 
                                type="text" 
                                className={touched.nombre ? (errors.nombre ? 'border-red-500' : 'border-green-500') : ''} 
                                placeholder='María' 
                                value={formData.nombre} 
                                onChange={(e) => handleChange('nombre', e.target.value)} 
                                onBlur={() => handleBlur('nombre')}
                            />
                            {touched.nombre && errors.nombre && <div className='text-sm text-red-500'>{errors.nombre}</div>}
                        </div>

                        <div className="space-y-2 w-full md:w-7/12">
                            <Label>Apellidos</Label>
                            <Input 
                                type="text" 
                                className={touched.apellidos ? (errors.apellidos ? 'border-red-500' : 'border-green-500') : ''} 
                                placeholder='Pérez Gómez' 
                                value={formData.apellidos} 
                                onChange={(e) => handleChange('apellidos', e.target.value)} 
                                onBlur={() => handleBlur('apellidos')}
                            />
                            {touched.apellidos && errors.apellidos && <div className='text-sm text-red-500'>{errors.apellidos}</div>}
                        </div>

                    </div>

                    <div className="flex flex-col md:flex-row gap-4">

                        <div className="space-y-2 w-full md:w-8/12">
                            <Label>Correo electrónico</Label>
                            <Input 
                                type="email" 
                                className={touched.email ? (errors.email ? 'border-red-500' : 'border-green-500') : ''}  
                                placeholder='correo@ucm.es' 
                                value={formData.email} 
                                onChange={(e) => handleChange('email', e.target.value)} 
                                onBlur={() => handleBlur('email')}
                            />
                            {touched.email && errors.email && <div className='text-sm text-red-500'>{errors.email}</div>}
                        </div>

                        <div className="space-y-2 w-full md:w-4/12">
                            <Label>Teléfono</Label>
                            <Input 
                                type="tel" 
                                className={touched.telefono ? (errors.telefono ? 'border-red-500' : 'border-green-500') : ''}   
                                placeholder='600 123 456' 
                                value={formData.telefono} 
                                onChange={(e) => handleChange('telefono', e.target.value)} 
                                onBlur={() => handleBlur('telefono')}
                            />
                            {touched.telefono && errors.telefono && <div className='text-sm text-red-500'>{errors.telefono}</div>}
                        </div>

                    </div>

                    <div className="space-y-2">
                        <Label>Contraseña</Label>
                        <Input 
                            type="password" 
                            className={touched.password ? (errors.password ? 'border-red-500' : 'border-green-500') : ''}   
                            placeholder='********' 
                            value={formData.password} 
                            onChange={(e) => handleChange('password', e.target.value)} 
                            onBlur={() => handleBlur('password')}/>
                        {touched.password && errors.password && <div className='text-sm text-red-500'>{errors.password}</div>}
                    </div>

                    <div className="space-y-2">
                        <Label>Repetir Contraseña</Label>
                        <Input 
                            type="password" 
                            className={touched.confirmPassword ? (errors.confirmPassword ? 'border-red-500' : 'border-green-500') : ''}   
                            placeholder='********' 
                            value={formData.confirmPassword} 
                            onChange={(e) => handleChange('confirmPassword', e.target.value)} 
                            onBlur={() => handleBlur('confirmPassword')}
                        />
                        {touched.confirmPassword && errors.confirmPassword && <div className='text-sm text-red-500'>{errors.confirmPassword}</div>}
                    </div>

                    <Button type='submit' className='w-full py-6 text-base font-semibold rounded-xl mt-5' disabled={!isFormValid}>Registrarme</Button>
                </form>

                <p className="text-center text-sm text-muted-foreground mt-5">
                    ¿Ya tienes cuenta? <Link to="/auth/login" className='text-primary font-medium hover:underline'>Inicia sesión aquí</Link>
                </p>
            </div>
        </div>
    );
};

export default RegisterPage;