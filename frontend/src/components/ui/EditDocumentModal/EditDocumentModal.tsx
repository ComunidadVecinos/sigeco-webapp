//Modal para editar el nombre de un documento o carpeta y descripción si es archivo
import React, {useEffect, useState} from 'react';
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter} from '../dialog';
import { Button } from '../button';
import { Input } from '../input';
import { Label } from '../label';
import { updateDocument } from '@/services/documentService';
import FeedbackModal from '@/components/ui/FeedbackModal/FeedbackModal';


interface EditDocumentModaProps {
    isOpen: boolean;
    onClose: () => void;
    communityId: string;
    docId: string;
    currentName: string;
    type: string;
    onSuccess:() => void;
    currentDescription?: string;
}

const EditDocumentModal: React.FC<EditDocumentModaProps> = ({isOpen, onClose, communityId, docId, currentName,currentDescription, type, onSuccess}) => {
    const [name, setName] = useState(currentName);
    const [description, setDescription] = useState(currentDescription || '');
    const [loading, setLoading] = useState(false);

    const [feedback, setFeedback] = useState<{isOpen: boolean, type: 'success' | 'error', message: string}>({isOpen: false, type: 'success', message: ''});
    const closeFeedback = () => setFeedback(prev => ({...prev, isOpen: false}));

    //Sincroniza los campos con los valores actuales 
    useEffect(() => {setName(currentName); setDescription(currentDescription || ''); }, [currentName, currentDescription]);

    //Envía los cambios al backend
    const handleSave = async () => {
        if(!name.trim()) return;
        setLoading(true);
        try{
            const data: any = {name: name.trim()};
            if(type === 'file') data.description = description.trim() || null;
            await updateDocument(communityId, docId, type, data);
            onClose();
            onSuccess();
        } catch (err: any){
            setFeedback({isOpen: true, type: 'error', message: 'Error al editar.'});

        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose() }>
            <DialogContent className='sm:max-w-[440px]'>
                <DialogHeader>
                    <DialogTitle>Editar Nombre</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                    <Label className='font-bold'>Nuevo nombre</Label>
                    <Input className='mt-2' value={name} onChange={(e) => setName(e.target.value)} />
                    {type === 'file' && (
                        <div className="py-2">
                            <Label className='font-bold'>Nueva descripción</Label>
                            <textarea className='w-full min-h-[60px] border border-gray-200 rounded-md p-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none mt-2' value={description} onChange={(e) => setDescription(e.target.value)} />
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => {onClose()}}>Cancelar</Button>
                    <Button onClick={handleSave} disabled={!name.trim() || loading}>
                        {loading ? 'Guardando...' : 'Guardar'}
                    </Button>
                </DialogFooter>
            </DialogContent>

            <FeedbackModal 
                isOpen={feedback.isOpen}
                type={feedback.type}
                message={feedback.message}
                onClose={closeFeedback}
            />

        </Dialog>
    );
};

export default EditDocumentModal;