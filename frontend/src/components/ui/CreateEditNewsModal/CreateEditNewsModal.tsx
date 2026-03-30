import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../dialog';
import { Button } from '../button';
import { Input } from '../input';
import { Label } from '../label';

interface CreateEditNewsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
    isEditing: boolean;
    formData: {title: string; content: string};
    setFormData: React.Dispatch<React.SetStateAction<{title: string; content: string}>>;
}

const CreateEditNewsModal: React.FC<CreateEditNewsModalProps> = ({isOpen, onClose, onSave, isEditing, formData, setFormData}) => {

    //Validar que no este vacio
    const isValid = !!formData.title.trim() && !!formData.content.trim();

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className='sm:max-w-[600px]'>
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
                        <Label className='font-bold'>Cuerpo de la noticia</Label>
                        <textarea
                            className='w-full min-h-[200px] border border-gray-200 rounded-md p-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring' 
                            value={formData.content}
                            onChange={(e) => setFormData({...formData, content: e.target.value})}
                        />
                    </div>
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
