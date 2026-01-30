import React from "react";
import './LogoutModal.css';

interface LogoutModalProps{
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

const LogoutModal: React.FC<LogoutModalProps> = ({isOpen, onClose, onConfirm}) => {
    if(!isOpen) return null;

    return(
        <>
            <div className="modal-overlay" onClick={onClose}></div>
            <div className="logout-modal">
                <div className="logout-modal-body text-center">
                    <i className="bi bi-box-arrow-left logout-icon"></i>
                    <h5 className="fw-bold mt-3">¿Cerrar sesión?</h5>
                    <p className="text-muted">Tendrás que volver a iniciar sesión para acceder a tu cuenta.</p>
                </div>
                <div className="logout-modal-footer">
                    <button className="btn btn-secondary btn-sm" onClick={onClose}>Cancelar</button>
                    <button className="btn btn-danger btn-sm" onClick={onConfirm}>Cerrar Sesión</button>
                </div>
            </div>
        </>
    );
};

export default LogoutModal;