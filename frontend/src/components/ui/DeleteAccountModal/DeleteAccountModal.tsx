import React from 'react';
import './DeleteAccountModal.css'

interface DeleteAccountModalProps{
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({isOpen, onClose, onConfirm}) => {
    if(!isOpen) return null;

    return (
        <>
            <div className="modal-overlay" onClick={onClose}></div>
            <div className="delete-account-modal">
                <div className="delete-account-modal-body">
                    <i className="bi bi-exclamation-triangle-fill delete-icon"></i>
                    <h5 className='fw-bold mt-3'>Eliminar cuenta</h5>
                    <h6 className="text-muted">Esta acción es irreversible</h6>
                    <p className="mt-3">
                        Al eliminar tu cuenta, perderás el acceso a todas tus comunidades y tu información personal será eliminada permanentemente.
                    </p>
                </div>
                <div className="delete-account-modal-footer">
                    <button className="btn btn-secondary btn-sm" onClick={onClose}>No, cancelar</button>
                    <button className="btn btn-danger btn-sm" onClick={onConfirm}>Sí, eliminar</button>
                </div>
            </div>
        </>
    );
};

export default DeleteAccountModal;