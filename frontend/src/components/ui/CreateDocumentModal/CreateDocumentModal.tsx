import React, {useState} from 'react';
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter} from '../dialog';
import { Button } from '../button';
import { Input } from '../input';
import { Label } from '../label';
import { uploadDocument, DocItem } from '@/services/documentService';

interface CreateDocumentModaProps {
    isOpen: boolean;
    onClose: () => void;
    communityId: string;
    folders: DocItem[];
    onSuccess:() => void;
}

const CreateDocumentModal: React.FC<CreateDocumentModaProps> = ({isOpen, onClose, communityId, folders, onSuccess}) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [folderId, setFolderId] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);

    const resetForm = () => {setName(''); setDescription(''); setFolderId(''); setFile(null);};

    const handleSave = async () => {
        if(!name.trim() || !file) return;
        setLoading(true);
        try{
            await uploadDocument(communityId,
                {name: name.trim(),
                description: description.trim() || undefined,
                folderId: folderId || undefined,
                file
                });
            resetForm();
            onClose();
            onSuccess();
        } catch (err: any){
            alert(err.response?.data?.error?.message || 'Error al subir el documento');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => {if(!open) {resetForm(); onClose(); }}}>
            <DialogContent className='sm:max-w-[520px]'>
                <DialogHeader>
                    <DialogTitle>Subir Documento</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className='flex flex-col gap-2'>
                        <Label className='font-bold'>Nombre del documento</Label>
                        <Input value={name} onChange={(e) => setName(e.target.value)}/>
                    </div>
                    <div className='flex flex-col gap-2'>
                        <Label className='font-bold'>Descripción <span className='text-gray-400 font-normal'>(opcional)</span></Label>
                        <Input value={description} onChange={(e) => setDescription(e.target.value)}/>
                    </div>
                    <div className='flex flex-col gap-2'>
                        <Label className='font-bold'>Carpeta destino <span className='text-gray-400 font-normal'>(opcional)</span></Label>
                        <select className='border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white'
                                value={folderId}
                                onChange={(e) => setFolderId(e.target.value)}
                        >
                            <option value="">Sin carpeta</option>
                            {folders.map(f => (<option key={f.id} value={f.id}>{f.name}</option>))}
                        </select>
                    </div>
                    <div className="flex flex-col gap-2">
                        <Label className='font-bold'>Archivo PDF</Label>
                        <Input type='file' accept='.pdf' onChange={(e) => setFile(e.target.files?.[0] || null)} />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => {resetForm(); onClose();}}>Cancelar</Button>
                    <Button onClick={handleSave} disabled={!name.trim() || !file || loading}>
                        {loading ? 'Creando...' : 'Crear documento'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default CreateDocumentModal;