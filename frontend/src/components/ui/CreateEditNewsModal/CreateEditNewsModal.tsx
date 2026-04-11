import React, { useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../dialog';
import { Button } from '../button';
import { Input } from '../input';
import { Label } from '../label';
import {ImagePlus, X} from 'lucide-react';

interface CreateEditNewsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
    isEditing: boolean;
    formData: {
        title: string; 
        content: string; 
        isEvent: boolean; 
        eventStartDate: string;
        eventStartTime: string;
        eventEndDate: string;
        eventEndTime: string;
        imageFile: File | null;
        imagePreview: string;
    };
    setFormData: React.Dispatch<React.SetStateAction<{
        title: string; 
        content: string; 
        isEvent: boolean; 
        eventStartDate: string;
        eventStartTime: string;
        eventEndDate: string;
        eventEndTime: string;
        imageFile: File | null;
        imagePreview: string;
    }>>;
}

const CreateEditNewsModal: React.FC<CreateEditNewsModalProps> = ({isOpen, onClose, onSave, isEditing, formData, setFormData}) => {

    const fileInputRef = useRef<HTMLInputElement>(null);

    //Validar que no este vacio
    const isValid = !!formData.title.trim() && !!formData.content.trim() && (!formData.isEvent || (!!formData.eventStartDate && !!formData.eventStartTime));

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if(!file) return;
        const reader = new FileReader();
        reader.onloadend = () => {
            setFormData({...formData, imageFile: file, imagePreview: reader.result as string});
        };
        reader.readAsDataURL(file);
    };

    const handleRemoveImage = () => {
        setFormData({...formData, imageFile: null, imagePreview: ''});
        if(fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className='sm:max-w-[600px] max-h-[90vh] overflow-y-auto'>
                <DialogHeader>
                    <DialogTitle>{isEditing ? 'Editar Comunicado' : 'Crear Nuevo Comunicado'}</DialogTitle>
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
                        <Label className='font-bold'>Cuerpo de la noticia</Label>
                        <textarea
                            className='w-full min-h-[200px] border border-gray-200 rounded-md p-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring' 
                            value={formData.content}
                            onChange={(e) => setFormData({...formData, content: e.target.value})}
                        />
                    </div>

                    <div className="flex items-center justify-between gap-3 border-t border-gray-100 pt-4">
                        <div>
                            <Label className='font-bold'>¿Es un evento?</Label>
                            <p className="text-xs text-gray-500 mt-0.5">Si lo activas, aparecerá en el calendario de la comunidad</p>
                        </div>
                        <button type='button' onClick={() => setFormData({...formData, isEvent: !formData.isEvent, eventStartDate: !formData.isEvent ? formData.eventStartDate : '', 
                                 eventStartTime: !formData.isEvent ? formData.eventStartTime : '',
                                 eventEndDate: '',
                                 eventEndTime: ''
                        })} className={`
                            relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${formData.isEvent ? 'bg-blue-600' : 'bg-gray-300'}`}>
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.isEvent ? 'translate-x-6' : 'translate-x-1'}`}/>
                            </button>
                    </div>

                    {formData.isEvent && (
                        <div className="flex flex-col gap-4 bg-blue-50/50 border border-blue-100 rounded-lg p-4">
                            <div className="flex flex-col gap-2">
                                <Label className='font-bold text-sm'>Inicio <span className='text-red-500'>*</span></Label>
                                <div className='flex gap-3'>
                                    <Input type='date' className='flex-1' value={formData.eventStartDate} onChange={(e) => setFormData({...formData, eventStartDate: e.target.value})}/>
                                    <Input type='time' className='w-[140px]' value={formData.eventStartTime} onChange={(e) => setFormData({...formData, eventStartTime: e.target.value})}/>
                                </div>
                            </div>
                            <div className="flex flex-col gap-2">
                                <div className="flex items-center justify-between">
                                    <Label className='font-bold text-sm text-gray-600'>Fin <span className='text-xs font-normal text-gray-400'>(opcional)</span></Label>
                                    {(formData.eventEndDate || formData.eventEndTime) && (
                                        <button type='button' className='text-xs text-red-500 hover:text-red-600' onClick={() => setFormData({...formData, eventEndDate: '', eventEndTime: ''})}>Limpiar</button>
                                    )}
                                </div>
                                <div className="flex gap-3">
                                    <Input type='date' className='flex-1' value={formData.eventEndDate} onChange={(e) => setFormData({...formData, eventEndDate: e.target.value})}/>
                                    <Input type='time' className='w-[140px]' value={formData.eventEndTime} onChange={(e) => setFormData({...formData, eventEndTime: e.target.value})}/>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancelar</Button>
                    <Button onClick={onSave} disabled={!isValid}>
                        {isEditing ? 'Guardar Cambios' : 'Publicar'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default CreateEditNewsModal;
