import React, {useState} from 'react';
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter} from '../dialog';
import { Button } from '../button';
import { Input } from '../input';
import { Label } from '../label';
import { createFolder } from '@/services/documentService';

interface CreateFolderModaProps {
    isOpen: boolean;
    onClose: () => void;
    communityId: string;
    parentId?: string | null;
    onSuccess:() => void;
}

const CreateFolderModal: React.FC<CreateFolderModaProps> = ({isOpen, onClose, communityId, parentId, onSuccess}) => {
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        if(!name.trim()) return;
        setLoading(true);
        try{
            await createFolder(communityId, {name: name.trim(), parentId: parentId || undefined});
            setName('');
            onClose();
            onSuccess();
        } catch (err: any){
            alert(err.response?.data?.error?.message || 'Error al crear la carpeta');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => {if(!open) {setName(''); onClose(); }}}>
            <DialogContent className='sm:max-w-[440px]'>
                <DialogHeader>
                    <DialogTitle>{parentId ? 'Nueva subcarpeta' : 'Nueva Carpeta'}</DialogTitle>
                </DialogHeader>
                <div className="py-2">
                    <Label className='font-bold'>Nombre de la carpeta</Label>
                    <Input className='mt-2' value={name} onChange={(e) => setName(e.target.value)}/>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => {setName(''); onClose();}}>Cancelar</Button>
                    <Button onClick={handleSave} disabled={!name.trim() || loading}>
                        {loading ? 'Creando...' : 'Crear carpeta'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default CreateFolderModal;