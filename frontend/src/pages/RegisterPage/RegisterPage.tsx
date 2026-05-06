import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register } from '../../services/authServices';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff } from 'lucide-react';
import { getApiErrorMessage, getApiFieldErrors, hasFieldErrors } from '@/lib/formErrors';

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
    const [globalError, setGlobalError] = useState('');
    const [touched, setTouched] = useState<Record<string, boolean>>({});

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    //Validacion de nombre
    const validateNombre = (value: string): string | undefined => {
        if (!value.trim()) return 'El nombre es requerido';
        return undefined;
    };

    //Validacion de apellidos
    const validateApellidos = (value: string): string | undefined => {
        if (!value.trim()) return 'Los apellidos son requeridos';
        return undefined;
    };

    //Validacion de email
    const validateEmail = (value: string): string | undefined => {
        if (!value.trim()) return 'El email es requerido';
        if (!value.endsWith('@ucm.es')) return 'El email debe ser @ucm.es';
        return undefined;
    };

    //Validacion de telefono
    const validateTelefono = (value: string): string | undefined => {
        if (!value.trim()) return undefined;
        if (!/^[\d\s]+$/.test(value)) return 'El telefono solo puede contener dígitos y espacios';
        const soloNum = value.replace(/\s/g, '');
        if (soloNum.length !== 9) return 'El teléfono debe tener 9 dígitos';
        return undefined;
    };

    //Validacion de contraseña
    const validatePassword = (value: string): string | undefined => {
        if (!value.trim()) return 'El contraseña es requerida';
        if (value.length < 8) return 'Mínimo 8 caracteres';
        if (!/[A-Z]/.test(value)) return 'Debe contener al menos una mayúscula';
        if (!/[a-z]/.test(value)) return 'Debe contener al menos una minúscula';
        if (!/[0-9]/.test(value)) return 'Debe contener al menos una número';
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(value)) return 'Debe contener un carácter especial (!@#$%^&*...)';
        return undefined;
    };

    //Validacion de confirmacion de contraseña
    const validateConfirmPassword = (value: string): string | undefined => {
        if (!value.trim()) return 'Debes repetir la contraseña';
        if (value !== formData.password) return 'Las contraseñas no coinciden';
        return undefined;
    };

    //Validar todo 
    const validateForm = (): boolean => {
        const newErrors: FormErrors = {
            nombre: validateNombre(formData.nombre),
            apellidos: validateApellidos(formData.apellidos),
            email: validateEmail(formData.email),
            telefono: validateTelefono(formData.telefono),
            password: validatePassword(formData.password),
            confirmPassword: validateConfirmPassword(formData.confirmPassword)
        };
        setErrors(newErrors);
        setGlobalError('');
        return !Object.values(newErrors).some(error => error !== undefined);
    };

    //Manejar cambios
    const handleChange = (field: keyof FormData, value: string) => {
        setFormData({ ...formData, [field]: value });
    };

    //Manejar blur
    const handleBlur = (field: keyof FormData) => {
        setTouched({ ...touched, [field]: true });

        const validators: Record<keyof FormData, (v: string) => string | undefined> = {
            nombre: validateNombre,
            apellidos: validateApellidos,
            email: validateEmail,
            telefono: validateTelefono,
            password: validatePassword,
            confirmPassword: validateConfirmPassword
        };

        setErrors({ ...errors, [field]: validators[field](formData[field]) });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setGlobalError('');

        const allTouched: Record<string, boolean> = {};
        Object.keys(formData).forEach(key => allTouched[key] = true);
        setTouched(allTouched);

        if (validateForm()) {
            try {
                await register(
                    formData.nombre,
                    formData.apellidos,
                    formData.email,
                    formData.telefono.trim() || undefined,
                    formData.password,
                    formData.confirmPassword
                );
                navigate('/auth/login');
            }
            catch (error: any) {
                const fieldErrors = getApiFieldErrors(error, {
                    firstName: 'nombre',
                    lastName: 'apellidos',
                    email: 'email',
                    phone: 'telefono',
                    password: 'password',
                    passwordConfirmation: 'confirmPassword'
                });

                if (hasFieldErrors(fieldErrors)) {
                    setErrors((prev) => ({ ...prev, ...fieldErrors }));
                    return;
                }

                setGlobalError(getApiErrorMessage(error, 'No se ha podido completar el registro. Revisa los datos e inténtalo de nuevo.'));
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
                {globalError && <div className='bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3 mb-5'>{globalError}</div>}

                <form className="space-y-4" onSubmit={handleSubmit} autoComplete="off">
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
                            <Label htmlFor="register-email">Correo electrónico</Label>
                            <Input
                                id="register-email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                className={touched.email ? (errors.email ? 'border-red-500' : 'border-green-500') : ''}
                                placeholder='correo@ucm.es'
                                value={formData.email}
                                onChange={(e) => handleChange('email', e.target.value)}
                                onBlur={() => handleBlur('email')}
                            />
                            {touched.email && errors.email && <div className='text-sm text-red-500'>{errors.email}</div>}
                        </div>

                        <div className="space-y-2 w-full md:w-4/12">
                            <Label htmlFor="register-phone">Teléfono</Label>
                            <Input
                                id="register-phone"
                                name="phone"
                                type="tel"
                                autoComplete="tel"
                                className={touched.telefono ? (errors.telefono ? 'border-red-500' : 'border-green-500') : ''}
                                placeholder='600 123 456 (opcional)'
                                value={formData.telefono}
                                onChange={(e) => handleChange('telefono', e.target.value)}
                                onBlur={() => handleBlur('telefono')}
                            />
                            {touched.telefono && errors.telefono && <div className='text-sm text-red-500'>{errors.telefono}</div>}
                        </div>

                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="register-password">Contraseña</Label>
                        <div className='relative'>
                            <Input
                                id="register-password"
                                name="password"
                                type={showPassword ? 'text' : 'password'}
                                autoComplete="new-password"
                                className={touched.password ? (errors.password ? 'border-red-500 pr-10' : 'border-green-500 pr-10') : 'pr-10'}
                                placeholder='********'
                                value={formData.password}
                                onChange={(e) => handleChange('password', e.target.value)}
                                onBlur={() => handleBlur('password')}
                            />
                            <button type="button" tabIndex={-1} className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600' onClick={() => setShowPassword(p => !p)}>
                                {showPassword ? <EyeOff className='h-4 w-4' /> : <Eye className='h-4 w-4' />}
                            </button>
                        </div>
                        {touched.password && errors.password && <div className='text-sm text-red-500'>{errors.password}</div>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="register-confirm-password">Repetir Contraseña</Label>
                        <div className='relative'>
                            <Input
                                id="register-confirm-password"
                                name="confirmPassword"
                                type={showConfirmPassword ? 'text' : 'password'}
                                autoComplete="new-password"
                                className={touched.confirmPassword ? (errors.confirmPassword ? 'border-red-500 pr-10' : 'border-green-500 pr-10') : 'pr-10'}
                                placeholder='********'
                                value={formData.confirmPassword}
                                onChange={(e) => handleChange('confirmPassword', e.target.value)}
                                onBlur={() => handleBlur('confirmPassword')}
                            />
                            <button type="button" tabIndex={-1} className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600' onClick={() => setShowConfirmPassword(p => !p)}>
                                {showConfirmPassword ? <EyeOff className='h-4 w-4' /> : <Eye className='h-4 w-4' />}
                            </button>
                        </div>
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
