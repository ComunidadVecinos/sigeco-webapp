import React, {useState, useRef} from "react";
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { updateAvatar } from "@/services/userServices";

interface EditPhotoModalProps{
    isOpen: boolean;
    onClose: () => void;
    currentPhoto: string;
    onSave: (newPhotoUrl: string) => void;
}

const EditPhotoModal: React.FC<EditPhotoModalProps> = ({isOpen, onClose, currentPhoto, onSave})=>{
    const [preview, setPreview] = useState<string>(currentPhoto);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if(file){
            setSelectedFile(file);
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
        if(!selectedFile) return;
        try{
            const {data} = await updateAvatar(selectedFile);
            onSave(data.imageUrl);
            onClose();
        } catch (err){
            console.error('Error al subir la imagen', err);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => {if(!open) onClose(); }}>
            <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                    <DialogTitle>Cambiar foto de perfil</DialogTitle>
                </DialogHeader>
                <div className="text-center space-y-4">
                    <div className="flex justify-center">
                        <img src={preview} alt="Vista previa" className="w-36 h-36 rounded-full object-cover border-3 border-gray-200" />
                    </div>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden"/>
                    <Button variant="outline" className="w-full" onClick={handleSelectFile}>
                        <Upload className="h-4 w-4 mr-2" />Seleccionar nueva foto
                    </Button>
                </div>
                <DialogFooter>
                    <Button variant="secondary" onClick={onClose}>Cerrar</Button>
                    <Button onClick={handleSave}>Guardar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default EditPhotoModal;