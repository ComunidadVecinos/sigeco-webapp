import React, {useEffect, useState} from "react";
import './EditProfileModal.css';

interface EditProfileModalProps{
    isOpen: boolean;
    onClose: () => void;
    initialData: {
        nombre: string;
        apellidos: string;
        telefono: string;
        email: string;
    };

    onSave: (data: {
        nombre: string;
        apellidos: string;
        telefono: string;
        email: string;
    }) => void;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({isOpen, onClose, initialData, onSave}) => {
    const [formData, setFormData] = useState(initialData);
    const [error, setError] = useState('');

    useEffect(() => {
        if(isOpen){
            setFormData(initialData);
            setError('');
        }
    }, [isOpen, initialData]);

    if(!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value});
        setError('');
    };

    const handleSubmit = () => {

        //Validar nombre
        if(formData.nombre !== initialData.nombre){
            if(!formData.nombre.trim()){
                setError('El nombre no puede estar vacío');
                return;
            }
        }

        //Validar apellidos
        if(formData.apellidos !== initialData.apellidos){
            if(!formData.apellidos.trim()){
                setError('Los apellidos no pueden estar vacíos');
                return;
            }
        }

        //Validar telefono
        if(formData.telefono !== initialData.telefono){
            const soloNumeros = formData.telefono.replace(/\D/g, '');
            if(soloNumeros.length !== 9){
                setError('El telefono debe tener 9 dígitos');
                return;
            }
        }

        //Validar telefono
        if(formData.email !== initialData.email){
            if(!formData.email.endsWith('@ucm.es')){
                setError('El email debe ser @ucm.es');
                return;
            }
        }

        onSave(formData);
        onClose();
    };

    const handleClose = () => {
        setError('');
        onClose();
    };

    return (
        <>
            <div className="modal-overlay" onClick={handleClose}></div>
            <div className="edit-modal">
                <div className="edit-modal-header">
                    <h5 className="fw-bold">Editar Información Personal</h5>
                    <button className="btn-close" onClick={handleClose}></button>
                </div>
                <div className="edit-modal-body">
                    {error && (<div className="alert alert-danger" role="alert">{error}</div>)}
                    <div className="mb-3">
                        <label htmlFor="nombre" className="form-label">Nombre</label>
                        <input type="text" className="form-control" name="nombre" value={formData.nombre} onChange={handleChange} />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="apellidos" className="form-label">Apellidos</label>
                        <input type="text" className="form-control" name="apellidos" value={formData.apellidos} onChange={handleChange} />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="tel" className="form-label">Teléfono</label>
                        <input type="tel" className="form-control" name="telefono" value={formData.telefono} onChange={handleChange} />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="correo" className="form-label">Correo electrónico</label>
                        <input type="email" className="form-control" name="email" value={formData.email} onChange={handleChange} />
                    </div>
                </div>
                <div className="edit-modal-footer">
                    <button className="btn btn-secondary" onClick={handleClose}>Cerrar</button>
                    <button className="btn btn-primary" onClick={handleSubmit}>Guardar</button>
                </div>
            </div>
        </>
    );
};

export default EditProfileModal;