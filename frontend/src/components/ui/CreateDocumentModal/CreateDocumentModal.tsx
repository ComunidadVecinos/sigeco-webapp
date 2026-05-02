import React, {useState} from 'react';
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter} from '../dialog';
import { Button } from '../button';
import { Input } from '../input';
import { Label } from '../label';
import { uploadDocument } from '@/services/documentService';

interface CreateDocumentModaProps {
    isOpen: boolean;
    onClose: () => void;
    communityId: string;
    folderId: string | null;
    onSuccess:() => void;
}

const CreateDocumentModal: React.FC<CreateDocumentModaProps> = ({isOpen, onClose, communityId, folderId, onSuccess}) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);

    const resetForm = () => {setName(''); setDescription(''); setFile(null);};

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
                    <DialogTitle>{folderId ? 'Subir documento a carpeta' : 'Subir Documento'}</DialogTitle>
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