import React, {useState, useRef} from "react";
import './EditPhotoModal.css';

interface EditPhotoModalProps{
    isOpen: boolean;
    onClose: () => void;
    currentPhoto: string;
    onSave: (newPhoto: string) => void;
}

const EditPhotoModal: React.FC<EditPhotoModalProps> = ({isOpen, onClose, currentPhoto, onSave})=>{
    const [preview, setPreview] = useState<string>(currentPhoto);
    const fileInputRef = useRef<HTMLInputElement>(null);

    if(!isOpen) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if(file){
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSelectFile = () => {
        fileInputRef.current?.click();
    };

    const handleSave = () => {
        onSave(preview);
        onClose();
    };

    return (
        <>
            <div className="modal-overlay" onClick={onClose}></div>
            <div className="edit-photo-modal">
                <div className="edit-photo-modal-header">
                    <h5 className="fw-bold">Cambiar foto de perfil</h5>
                    <button className="btn-close" onClick={onClose}></button>
                </div>
                <div className="edit-photo-modal-body">
                    <div className="photo-preview-container">
                        <img src={preview} alt="Vista previa" className="photo-preview"/>
                    </div>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" style={{display: 'none'}} />
                    <button className="btn btn-outline-primary w-100 mt-3" onClick={handleSelectFile}>
                        <i className="bi bi-upload me-2"></i>Seleccionar nueva foto
                    </button>
                </div>
                <div className="edit-photo-modal-footer">
                    <button className="btn btn-secondary" onClick={onClose}>Cerrar</button>
                    <button className="btn btn-primary" onClick={handleSave}>Guardar</button>
                </div>
            </div>
        </>
    );
};

export default EditPhotoModal;