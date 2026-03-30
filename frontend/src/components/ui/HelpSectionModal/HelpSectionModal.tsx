import React, {useEffect, useState} from 'react';
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter} from "@/components/ui/dialog";
import { Button } from '../button';
import { Label } from '../label';
import { Input } from '../input';
import { addHelpSection, updateHelpSection } from '@/services/helpServices';
import { getApiErrorMessage, getApiFieldErrors } from '@/lib/formErrors';

interface HelpSectionModalProps{
    isOpen: boolean;
    onClose: () => void;
    communityId: string;
    section?: {id: string, title: string; description: string} | null;
    onSuccess: () => void;
}

const HelpSectionModal: React.FC<HelpSectionModalProps> = ({isOpen, onClose, communityId, section, onSuccess})=>{
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    const isEdit = !!section;

    useEffect(() => {
        if (section) {
            setTitle(section.title);
            setDescription(section.description);
        } else {
            setTitle('');
            setDescription('');
        }

        setError('');
        setSuccess('');
        setFieldErrors({});
    }, [isOpen, section]);

    const handleSubmit = async () => {
        setError('');
        setSuccess('');

        const nextFieldErrors: Record<string, string> = {};

        if (!title.trim()) {
            nextFieldErrors.title = 'Introduce el título de la sección.';
        }

        if (!description.trim()) {
            nextFieldErrors.description = 'Introduce la descripción de la sección.';
        }

        setFieldErrors(nextFieldErrors);

        if (Object.keys(nextFieldErrors).length > 0) {
            return;
        }

        try{
            if(isEdit && section){
                await updateHelpSection(communityId, section.id, {title, description});
                setSuccess('Sección actualizada.');
            }
            else{
                await addHelpSection(communityId, {title, description});
                setSuccess('Sección añadida.');
            }
            onSuccess();
            setTimeout(() => { handleClose(); }, 1500);
        }
        catch(err: any){
            const nextFieldErrors = getApiFieldErrors(err, {
                title: 'title',
                description: 'description'
            });

            if (Object.keys(nextFieldErrors).length > 0) {
                setFieldErrors(nextFieldErrors);
                return;
            }

            setError(getApiErrorMessage(err, 'No se ha podido guardar la sección.'));
        }
    };

    const handleClose = () => {
        setTitle('');
        setDescription('');
        setError('');
        setSuccess('');
        setFieldErrors({});
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{isEdit ? 'Editar sección' : 'Añadir sección de ayuda'}</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label>Título</Label>
                        <Input
                            value={title}
                            onChange={(e) => {
                                setTitle(e.target.value);
                                setFieldErrors((prev) => ({ ...prev, title: '' }));
                            }}
                            placeholder='Ej: Horarios de recogida de basura'
                        />
                        {fieldErrors.title && <p className='text-sm text-red-500'>{fieldErrors.title}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label>Descripción</Label>
                        <textarea
                            className='flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
                            value={description}
                            onChange={(e) => {
                                setDescription(e.target.value);
                                setFieldErrors((prev) => ({ ...prev, description: '' }));
                            }}
                            placeholder='Escribe la información de ayuda...'
                            rows={5}
                        />
                        {fieldErrors.description && <p className='text-sm text-red-500'>{fieldErrors.description}</p>}
                    </div>

                    {error && <p className='text-sm text-red-500'>{error}</p>}
                    {success && <p className='text-sm text-green-500'>{success}</p>}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={handleClose}>Cancelar</Button>
                    <Button onClick={handleSubmit}>{isEdit ? 'Guardar' : 'Añadir'}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default HelpSectionModal;