//Modal reutilizable para cambiar o eliminar la foto de perfil o comunidad con vista previa
import React, {useEffect, useRef, useState} from "react";
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, Trash2 } from "lucide-react";
import { updateAvatar } from "@/services/userServices";
import { getApiErrorMessage } from '@/lib/formErrors';
import ConfirmModal from '@/components/ui/ConfirmModal/ConfirmModal';

interface EditPhotoModalProps{
    isOpen: boolean;
    onClose: () => void;
    currentPhoto: string;
    onSave: (newPhotoUrl: string) => void;
    title?: string;
    selectLabel?: string;
    saveLabel?: string;
    saveErrorFallback?: string;
    uploadPhoto?: (file: File) => Promise<{ data?: { profileImageUrl?: string; community?: { avatarUrl?: string } } }>;
    onDeletePhoto?: () => Promise<void>;
    defaultPhoto?: string;
}

const EditPhotoModal: React.FC<EditPhotoModalProps> = ({
    isOpen,
    onClose,
    currentPhoto,
    onSave,
    title = 'Cambiar foto de perfil',
    selectLabel = 'Seleccionar nueva foto',
    saveLabel = 'Guardar',
    saveErrorFallback = 'No se ha podido actualizar la foto de perfil.',
    uploadPhoto,
    onDeletePhoto,
    defaultPhoto
})=>{
    const [preview, setPreview] = useState<string>(currentPhoto);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [error, setError] = useState('');
    const [deleting, setDeleting] = useState(false);

    const [confirmAction, setConfirmAction] = useState({isOpen: false, title: '', message: ''});

    //Sincroniza la vista previa con la foto actual cada vez que se abre el modal   
    useEffect(() => {
        setPreview(currentPhoto);
    }, [currentPhoto, isOpen]);

    //Lee el archivo seleccionado y genera una vista previa
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if(file){
            setSelectedFile(file);
            setError('');
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    //Elige la imagen que se quiere poner
    const handleSelectFile = () => {
        fileInputRef.current?.click();
    };

    //Sube la imagen al backend y devuelve la nueva url
    const handleSave = async () => {
        if(!selectedFile) {
            setError('Selecciona primero una imagen.');
            return;
        }

        try{
            const response = uploadPhoto ? await uploadPhoto(selectedFile) : await updateAvatar(selectedFile);
            const nextPhotoUrl = response?.data?.profileImageUrl || response?.data?.community?.avatarUrl;

            if (!nextPhotoUrl) {
                throw new Error('PHOTO_URL_NOT_FOUND');
            }

            onSave(nextPhotoUrl);
            handleClose();
        } 
        catch (err){
            setError(getApiErrorMessage(err, saveErrorFallback));
        }
    };

    //Elimina la foto actual y restaura la imagen por defecto
    const handleDelete = async () => {
        if(!onDeletePhoto) return;
        setDeleting(true);
        setError('');
        try{
            await onDeletePhoto();
            if(defaultPhoto){
                onSave(defaultPhoto);
            }
            handleClose();
        } catch (err){
            setError(getApiErrorMessage(err, 'No se ha podido eliminar la imagen'));
        }
    }

    //Limpia el archivo seleccionado y restaura la vista previa al cerrar
    const handleClose = () => {
        setSelectedFile(null);
        setPreview(currentPhoto);
        setError('');
        onClose();
    };

    //No muestra el boton de eliminar si ya tiene la foto por defecto
    const isDefaultPhoto = defaultPhoto && currentPhoto === defaultPhoto;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => {if(!open) handleClose(); }}>
            <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 text-center">
                    <div className="flex justify-center">
                        <img src={preview} alt="Vista previa" className="h-36 w-36 rounded-full border-2 border-gray-200 object-cover" />
                    </div>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden"/>
                    <Button variant="outline" className="w-full" onClick={handleSelectFile}>
                        <Upload className="mr-2 h-4 w-4" />{selectLabel}
                    </Button>
                    {onDeletePhoto && !isDefaultPhoto && (
                        <Button variant="outline" className="w-full text-red-600 border-red-200 hover:bg-red-50" onClick={ () => setConfirmAction({isOpen: true, title: 'Eliminar foto', message: '¿Eliminar la imagen actual?'})} disabled={deleting}>
                            <Trash2 className="mr-2 h-4 w-4" />{deleting ? 'Eliminando...' : 'Eliminar foto actual'}
                        </Button>
                    )}
                    {error && <p className='text-sm text-red-500'>{error}</p>}
                </div>
                <DialogFooter>
                    <Button variant="secondary" onClick={handleClose}>Cerrar</Button>
                    <Button onClick={handleSave}>{saveLabel}</Button>
                </DialogFooter>
            </DialogContent>

                    <ConfirmModal
                        isOpen={confirmAction.isOpen}
                        onClose={() => setConfirmAction({...confirmAction, isOpen: false})}
                        title={confirmAction.title}
                        message={confirmAction.message}
                        isDestructive={true}
                        confirmText='Sí, eliminar'
                        onConfirm={async () => {
                            await handleDelete();
                        }}
                    />

        </Dialog>
    );
};

export default EditPhotoModal;