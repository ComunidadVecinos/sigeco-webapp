import React, {useState} from 'react';
import {Link, useNavigate} from 'react-router-dom';
import './RegisterPage.css';
import {register} from '../../services/authServices';

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
        if(!/^[\d\s]+$/.test(value)) return 'El telefono solo puede contener numeros y espacios';
        const soloNum = value.replace(/\s/g, '');
        if(soloNum.length !== 9) return 'El teléfono debe tener 9 dígitos';
        return undefined;
    };

    //Validacion de contraseña
    const validatePassword = (value: string):string | undefined => {
        if(!value.trim()) return 'El contraseña es requerida';
        if(value.length < 8) return 'Mínimo 8 caracteres';
        if(!/[A-Z]/.test(value)) return 'Debe contener al menos una mayúscula';
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
                navigate('/auth/me');
            }
            catch (error: any){
                setErrors({email: error.response?.data?.message || 'Error al registrar'});
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
        <div className="register-container">
            <div className="register-card">
                <h1 className="register-title">Registrar una nueva cuenta</h1>
                <p className="register-subtitle">¡Únete ahora! Crea tu cuenta en segundos</p>

                <form action="" className="register-form" onSubmit={handleSubmit}>
                    <div className="row">
                        <div className="col-12 col-md-5 mb-3">
                            <label htmlFor="" className="form-label">Nombre</label>
                            <input type="text" className={`form-control ${touched.nombre ? (errors.nombre ? 'is-invalid' : 'is-valid') : ''}`} placeholder='María' value={formData.nombre} onChange={(e) => handleChange('nombre', e.target.value)} onBlur={() => handleBlur('nombre')}/>
                            {touched.nombre && errors.nombre && <div className='invalid-feedback'>{errors.nombre}</div>}
                        </div>
                        <div className="col-12 col-md-7 mb-3">
                            <label htmlFor="" className="form-label">Apellidos</label>
                            <input type="text" className={`form-control ${touched.apellidos ? (errors.apellidos ? 'is-invalid' : 'is-valid') : ''}`} placeholder='Pérez Gómez' value={formData.apellidos} onChange={(e) => handleChange('apellidos', e.target.value)} onBlur={() => handleBlur('apellidos')}/>
                            {touched.apellidos && errors.apellidos && <div className='invalid-feedback'>{errors.apellidos}</div>}
                        </div>
                    </div>

                    <div className="row">
                        <div className="col-12 col-md-8 mb-3">
                            <label htmlFor="" className="form-label">Correo electrónico</label>
                            <input type="email" className={`form-control ${touched.email ? (errors.email ? 'is-invalid' : 'is-valid') : ''}`}  placeholder='correo@ucm.es' value={formData.email} onChange={(e) => handleChange('email', e.target.value)} onBlur={() => handleBlur('email')}/>
                            {touched.email && errors.email && <div className='invalid-feedback'>{errors.email}</div>}
                        </div>
                        <div className="col-12 col-md-4 mb-3">
                            <label htmlFor="" className="form-label">Teléfono</label>
                            <input type="tel" className={`form-control ${touched.telefono ? (errors.telefono ? 'is-invalid' : 'is-valid') : ''}`}   placeholder='600 123 456' value={formData.telefono} onChange={(e) => handleChange('telefono', e.target.value)} onBlur={() => handleBlur('telefono')}/>
                            {touched.telefono && errors.telefono && <div className='invalid-feedback'>{errors.telefono}</div>}
                        </div>
                    </div>

                    <div className="mb-3">
                        <label htmlFor="" className="form-label">Contraseña</label>
                        <input type="password" className={`form-control ${touched.password ? (errors.password ? 'is-invalid' : 'is-valid') : ''}`}   placeholder='********' value={formData.password} onChange={(e) => handleChange('password', e.target.value)} onBlur={() => handleBlur('password')}/>
                        {touched.password && errors.password && <div className='invalid-feedback'>{errors.password}</div>}
                    </div>

                    <div className="mb-3">
                        <label htmlFor="" className="form-label">Repetir Contraseña</label>
                        <input type="password" className={`form-control ${touched.confirmPassword ? (errors.confirmPassword ? 'is-invalid' : 'is-valid') : ''}`}   placeholder='********' value={formData.confirmPassword} onChange={(e) => handleChange('confirmPassword', e.target.value)} onBlur={() => handleBlur('confirmPassword')}/>
                        {touched.confirmPassword && errors.confirmPassword && <div className='invalid-feedback'>{errors.confirmPassword}</div>}
                    </div>

                    <button type='submit' className='btn btn-primary register-btn' disabled={!isFormValid}>Registrarme</button>
                </form>

                <p className="register-login">
                    ¿Ya tienes cuenta? <Link to="/auth/login">Inicia sesión aquí</Link>
                </p>
            </div>
        </div>
    );
};

export default RegisterPage;