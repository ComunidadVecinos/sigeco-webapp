//Modal para crear o editar una incidencia: formulario con título, imagen opcional y descripción
import React, { useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../dialog';
import { Button } from '../button';
import { Input } from '../input';
import { Label } from '../label';
import {ImagePlus, X} from 'lucide-react';

interface CreateEditIncidentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
    isEditing: boolean;
    formData: {
        title: string; 
        description: string; 
        imageFile: File | null;
        imagePreview: string;
    };
    setFormData: React.Dispatch<React.SetStateAction<{
        title: string; 
        description: string; 
        imageFile: File | null;
        imagePreview: string;
    }>>;
}

const CreateEditIncidentModal: React.FC<CreateEditIncidentModalProps> = ({isOpen, onClose, onSave, isEditing, formData, setFormData}) => {

    const fileInputRef = useRef<HTMLInputElement>(null);

    //Validación: título y descripción obligatorios
    const isValid = !!formData.title.trim() && !!formData.description.trim();

    //Lee el archivo seleccionado y genera una vista previa
    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if(!file) return;
        const reader = new FileReader();
        reader.onloadend = () => {
            setFormData({...formData, imageFile: file, imagePreview: reader.result as string});
        };
        reader.readAsDataURL(file);
    };

    //Elimina la imagen seleccionada
    const handleRemoveImage = () => {
        setFormData({...formData, imageFile: null, imagePreview: ''});
        if(fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className='sm:max-w-[600px] max-h-[90vh] overflow-y-auto'>
                <DialogHeader>
                    <DialogTitle>{isEditing ? 'Editar Incidencia' : 'Crear Nueva Incidencia'}</DialogTitle>
                </DialogHeader>

                <div className='grid gap-4 py-4'>
                    <div className='flex flex-col gap-2'>
                        <Label className='font-bold'>Título</Label>
                        <Input
                            value={formData.title}
                            onChange={(e) => setFormData({...formData, title: e.target.value})}
                        />
                    </div>
                    <div className='flex flex-col gap-2'>
                        <Label className='font-bold'>Imagen <span className='text-xs font-normal text-gray-400'>(opcional)</span></Label>
                        <input type="file" ref={fileInputRef} accept='image/*' className='hidden' onChange={handleImageSelect} />
                        {formData.imagePreview ? (
                            <div className="relative rounded-lg overflow-hidden border border-gray-200">
                                <img src={formData.imagePreview} alt="Vista previa" className='w-full max-h-[200px] object-cover' />
                                <button type='button' onClick={handleRemoveImage} className='absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1.5 transition-colors'>
                                    <X className='h-4 w-4'/>
                                </button>
                            </div>
                        ) : (
                            <button type='button' onClick={() => fileInputRef.current?.click()} className='flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-200 hover:border-blue-300 rounded-lg p-6 text-gray-400 hover:text-blue-500 transition-colors cursor-pointer'>
                                <ImagePlus className='h-8 w-8' />
                                <span className='text-sm font-medium'>Haz clic para añadir una imagen</span>
                            </button>
                        )}
                    </div>
                    <div className='flex flex-col gap-2'>
                        <Label className='font-bold'>Descripción</Label>
                        <textarea
                            className='w-full min-h-[150px] border border-gray-200 rounded-md p-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring' 
                            value={formData.description}
                            onChange={(e) => setFormData({...formData, description: e.target.value})}
                        />
                    </div>
                </div>
                
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancelar</Button>
                    <Button onClick={onSave} disabled={!isValid}>
                        {isEditing ? 'Guardar Cambios' : 'Reportar Incidencia'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default CreateEditIncidentModal;
