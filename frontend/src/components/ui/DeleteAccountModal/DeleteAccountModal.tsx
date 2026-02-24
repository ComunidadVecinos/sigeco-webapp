import React, {useState} from 'react';
import {Dialog, DialogContent, DialogFooter} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertTriangle } from 'lucide-react';
import { deleteAccount } from '@/services/userServices';

interface DeleteAccountModalProps{
    isOpen: boolean;
    onClose: () => void;
    userEmail: string;
    onConfirm: () => void;
}

const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({isOpen, onClose, userEmail, onConfirm}) => {

    const [confirmText, setConfirmText] = useState('');
    const [error, setError] = useState('');

    const expectedText = `Eliminar ${userEmail}`;

    const handleDelete = async () => {
        if(confirmText !== expectedText){
            setError(`Escribe exactamente: "${expectedText}"`);
            return;
        }
        try{
            await deleteAccount(confirmText);
            onConfirm();
        } catch (err: any){
            setError(err.response?.data?.error?.message || 'Error al eliminar la cuenta');
        }
    };

    const handleClose = () =>{
        setConfirmText('');
        setError('');
        onClose();
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => {if(!open) handleClose(); }}>
            <DialogContent className="sm:max-w-sm">
                <div className="text-center py-4">
                    <AlertTriangle className="h-12 w-12 text-red-500 mx-auto"/>
                    <h5 className='font-bold mt-3'>Eliminar cuenta</h5>
                    <h6 className="text-muted-foreground text-sm">Esta acción es irreversible</h6>
                    <p className="mt-3 text-sm">
                        Al eliminar tu cuenta, perderás el acceso a todas tus comunidades y tu información personal será eliminada permanentemente.
                    </p>
                </div>
                <div className="space-y-2">
                    <Label>Escribe <strong>{expectedText}</strong> para confirmar</Label>
                    <Input value={confirmText} onChange={(e) => setConfirmText(e.target.value)} placeholder={expectedText}></Input>
                    {error && <p className='text-sm text-red-500'>{error}</p>}
                </div>
                <DialogFooter className="justify-center">
                    <Button variant="secondary" size="sm" onClick={handleClose}>Cancelar</Button>
                    <Button variant="destructive" size="sm" onClick={handleDelete} disabled={confirmText !== expectedText}>Eliminar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default DeleteAccountModal;