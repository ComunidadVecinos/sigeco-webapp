import React, {useState, useEffect} from 'react';
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter} from "@/components/ui/dialog";
import { Button } from '../button';
import { Label } from '../label';
import { Input } from '../input';
import { addHelpSection, updateHelpSection } from '@/services/helpServices';    

interface HelpSectionModalProps{
    isOpen: boolean;
    onClose: () => void;
    communityId: number;
    section?: {id: number, title: string; description: string} | null;
    onSuccess: () => void;
}

const HelpSectionModal: React.FC<HelpSectionModalProps> = ({isOpen, onClose, communityId, section, onSuccess})=>{
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const isEdit = !!section;

    useEffect(() => {
        if(section){
            setTitle(section.title);
            setDescription(section.description);
        }
        else{
            setTitle('');
            setDescription('');
        }
    }, [section, isOpen]);

    const handleSubmit = async () => {
        setError('');
        setSuccess('');
        if(!title.trim() || !description.trim()){
            setError('El titulo y la descripción son requeridos.');
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
            const msg = err.response?.data?.error?.message || 'Error al guardar seccion';
            setError(msg);
        }
    };

    const handleClose = () => {
        setTitle('');
        setDescription('');
        setError('');
        setSuccess('');
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
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder='Ej: Horarios de recogida de basura'
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Descripción</Label>
                        <textarea 
                            className='flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[120px]'
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder='Escribe la información de ayuda...'
                            rows={5}
                        />
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