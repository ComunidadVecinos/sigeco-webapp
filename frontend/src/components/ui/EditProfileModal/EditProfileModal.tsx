import React, {useState} from "react";
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

    if(!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value});
    };

    const handleSubmit = () => {
        onSave(formData);
        onClose();
    };

    return (
        <>
            <div className="modal-overlay" onClick={onClose}></div>
            <div className="edit-modal">
                <div className="edit-modal-header">
                    <h5 className="fw-bold">Editar Información Personal</h5>
                    <button className="btn-close" onClick={onClose}></button>
                </div>
                <div className="edit-modal-body">
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
                        <input type="tel" className="form-control" name="tel" value={formData.telefono} onChange={handleChange} />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="correo" className="form-label">Correo electrónico</label>
                        <input type="email" className="form-control" name="correo" value={formData.email} onChange={handleChange} />
                    </div>
                </div>
                <div className="edit-modal-footer">
                    <button className="btn btn-secondary" onClick={onClose}>Cerrar</button>
                    <button className="btn btn-primary" onClick={handleSubmit}>Guardar</button>
                </div>
            </div>
        </>
    );
};

export default EditProfileModal;