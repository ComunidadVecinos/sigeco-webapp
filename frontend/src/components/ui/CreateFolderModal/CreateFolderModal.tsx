import React, {useState} from 'react';
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter} from '../dialog';
import { Button } from '../button';
import { Input } from '../input';
import { Label } from '../label';
import { createFolder, DocItem } from '@/services/documentService';

interface CreateFolderModaProps {
    isOpen: boolean;
    onClose: () => void;
    communityId: string;
    folders: DocItem[];
    onSuccess:() => void;
}

const CreateFolderModal: React.FC<CreateFolderModaProps> = ({isOpen, onClose, communityId, folders, onSuccess}) => {
    const [name, setName] = useState('');
    const [parentId, setParentId] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        if(!name.trim()) return;
        setLoading(true);
        try{
            await createFolder(communityId, {name: name.trim(), parentId: parentId || undefined});
            setName('');
            setParentId('');
            onClose();
            onSuccess();
        } catch (err: any){
            alert(err.response?.data?.error?.message || 'Error al crear la carpeta');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => {if(!open) {setName(''); setParentId(''); onClose(); }}}>
            <DialogContent className='sm:max-w-[440px]'>
                <DialogHeader>
                    <DialogTitle>Nueva Carpeta</DialogTitle>
                </DialogHeader>
                <div className="py-2">
                    <Label className='font-bold'>Nombre de la carpeta</Label>
                    <Input className='mt-2' value={name} onChange={(e) => setName(e.target.value)}/>
                </div>
                <div className="flex flex-col gap-2 py-2 mb-2">
                    <Label className='font-bold'>
                        Carpeta destino <span className='text-gray-400 font-normal'>(opcional)</span>
                    </Label>
                    <select className='border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white' value={parentId} onChange={(e) => setParentId(e.target.value)}>
                        <option value="">En la raíz (sin carpeta)</option>
                        {folders.map(f => (<option key={f.id} value={f.id}>{f.name}</option>))}
                    </select>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => {setName(''); setParentId(''); onClose();}}>Cancelar</Button>
                    <Button onClick={handleSave} disabled={!name.trim() || loading}>
                        {loading ? 'Creando...' : 'Crear carpeta'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default CreateFolderModal;