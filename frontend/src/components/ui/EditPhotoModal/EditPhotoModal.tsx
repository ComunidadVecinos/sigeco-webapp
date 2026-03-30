import React, {useEffect, useRef, useState} from "react";
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { updateAvatar } from "@/services/userServices";
import { getApiErrorMessage } from '@/lib/formErrors';

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
    uploadPhoto
})=>{
    const [preview, setPreview] = useState<string>(currentPhoto);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [error, setError] = useState('');

    useEffect(() => {
        setPreview(currentPhoto);
    }, [currentPhoto, isOpen]);

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

    const handleSelectFile = () => {
        fileInputRef.current?.click();
    };

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

    const handleClose = () => {
        setSelectedFile(null);
        setPreview(currentPhoto);
        setError('');
        onClose();
    };

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
                    {error && <p className='text-sm text-red-500'>{error}</p>}
                </div>
                <DialogFooter>
                    <Button variant="secondary" onClick={handleClose}>Cerrar</Button>
                    <Button onClick={handleSave}>{saveLabel}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default EditPhotoModal;