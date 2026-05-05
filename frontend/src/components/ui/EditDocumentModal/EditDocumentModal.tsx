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
}

const EditDocumentModal: React.FC<EditDocumentModaProps> = ({isOpen, onClose, communityId, docId, currentName, type, onSuccess}) => {
    const [name, setName] = useState(currentName);
    const [loading, setLoading] = useState(false);

    const [feedback, setFeedback] = useState<{isOpen: boolean, type: 'success' | 'error', message: string}>({isOpen: false, type: 'success', message: ''});
    const closeFeedback = () => setFeedback(prev => ({...prev, isOpen: false}));

    useEffect(() => {setName(currentName); }, [currentName]);

    const handleSave = async () => {
        if(!name.trim()) return;
        setLoading(true);
        try{
            await updateDocument(communityId, docId, type, { name: name.trim() });
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