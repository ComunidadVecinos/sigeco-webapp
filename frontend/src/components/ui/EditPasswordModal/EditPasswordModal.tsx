import React, {useState} from "react";
import './EditPasswordModal.css';

interface EditPasswordModalProps{
    isOpen: boolean;
    onClose: () => void;
    onSave: (newPassword: string) => void;
    currentPasswordCheck: (password: string) => boolean;
}

const EditPasswordModal: React.FC<EditPasswordModalProps> = ({isOpen, onClose, onSave, currentPasswordCheck}) => {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');

    if(!isOpen) return null;

    const handleSubmit = () => {
        setError('');

        //Validar contraseña actual
        if(!currentPasswordCheck(currentPassword)){
            setError('La contraseña actual no es correcta');
            return;
        }

        //Validar que la nueva no se igual que la actual
        if(newPassword === currentPassword){
            setError('La nueva contraseña no puede ser igual a la actual');
            return;
        }

        //Validar longittud minima 
        if(newPassword.length < 8){
            setError('La contraseña debe tener al menos 8 caracteres');
            return;
        }

        //Validar mayuscula
        if(!/[A-Z]/.test(newPassword)){
            setError('La contraseña debe tener al menos una mayúscula');
            return;
        }

        //Validar número
        if(!/[0-9]/.test(newPassword)){
            setError('La contraseña debe tener al menos un número');
            return;
        }

        //Validar carácter especial
        if(!/[!@#$%^&*(),.?":{}|<>]/.test(newPassword)){
            setError('La contraseña debe tener al menos un carácter especial (!@#$%^&*(),.?":{}|<>');
            return;
        }

        //Validar que coinciden
        if(newPassword !== confirmPassword){
            setError('Las contraseñas nuevas no coinciden');
            return;
        }

        onSave(newPassword);
        handleClose();
    };
    
    const handleClose = () => {
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setError('');
        onClose();
    }

    return (
        <>
            <div className="modal-overlay" onClick={handleClose}></div>
            <div className="change-password-modal">
                <div className="change-password-modal-header">
                    <h5 className="fw-bold">Cambiar contraseña</h5>
                    <button className="btn-close" onClick={handleClose}></button>
                </div>
                <div className="change-password-modal-body">
                    {error && (
                        <div className="alert alert-danger" role="alert">{error}</div>
                    )}
                    <div className="mb-3">
                        <label className="form-label">Contraseña actual</label>
                        <input type="password" className="form-control" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Introduce tu contraseña actual"/>
                    </div>
                    <div className="mb-3">
                        <label className="form-label">Nueva contraseña</label>
                        <input type="password" className="form-control" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Introduce la nueva contraseña"/>
                    </div>
                    <div className="mb-3">
                        <label className="form-label">Confirmar nueva contraseña</label>
                        <input type="password" className="form-control" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repite la nueva contraseña"/>
                    </div>
                </div>
                <div className="change-password-modal-footer">
                    <button className="btn btn-secondary" onClick={handleClose}>Cerrar</button>
                    <button className="btn btn-primary" onClick={handleSubmit}>Guardar</button>
                </div>
            </div>
        </>
    );
};

export default EditPasswordModal;