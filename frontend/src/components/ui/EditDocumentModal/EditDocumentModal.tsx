import React, {useEffect, useState} from 'react';
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter} from '../dialog';
import { Button } from '../button';
import { Input } from '../input';
import { Label } from '../label';
import { updateDocument } from '@/services/documentService';

interface EditDocumentModaProps {
    isOpen: boolean;
    onClose: () => void;
    communityId: string;
    docId: string;
    currentName: string;
    onSuccess:() => void;
}

const EditDocumentModal: React.FC<EditDocumentModaProps> = ({isOpen, onClose, communityId, docId, currentName, onSuccess}) => {
    const [name, setName] = useState(currentName);
    const [loading, setLoading] = useState(false);

    useEffect(() => {setName(currentName); }, [currentName]);

    const handleSave = async () => {
        if(!name.trim()) return;
        setLoading(true);
        try{
            await updateDocument(communityId, docId, { name: name.trim() });
            onClose();
            onSuccess();
        } catch (err: any){
            alert(err.response?.data?.error?.message || 'Error al editar');
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
        </Dialog>
    );
};

export default EditDocumentModal;