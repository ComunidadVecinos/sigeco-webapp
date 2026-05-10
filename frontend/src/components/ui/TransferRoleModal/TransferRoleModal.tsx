//Modal para trasnferir la presidencia o vicepresidencia a otro miembro
import React, {useState} from 'react';
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter} from "@/components/ui/dialog";
import { Button } from '../button';
import { Label } from '../label';
import { Input } from '../input';
import { transferPresident, transferVicepresident } from '@/services/adminService';
import { useAuth } from '@/context/authContext';

interface TransferRoleModalProps{
    isOpen: boolean;
    onClose: () => void;
    communityId: string;
    userId: string;
    memberAlias: string;
    transferType: 'president' | 'vicepresident';
    onSuccess: () => void;
}

const TransferRoleModal: React.FC<TransferRoleModalProps> = ({isOpen, onClose, communityId, userId, memberAlias, transferType, onSuccess}) => {
    const [confirmText, setConfirmText] = useState('');
    const [error, setError] = useState('');
    const { refreshUser } = useAuth();

    //Texto de confirmación dinámico según el tipo de transferencia
    const expectedText = transferType === 'president' ? 'TRANSFERIR PRESIDENTE' : 'TRANSFERIR VICEPRESIDENTE';

    //Valida el texto, ejecuta la transferencia de rol y refresca el usuario
    const handleSubmit = async () => {
        setError('');
        if(confirmText !== expectedText){
            setError(`Escribe "${expectedText}" para confirmar.`);
            return;
        }
        try{
            if(transferType === 'president'){
                await transferPresident(communityId, userId);
            }
            else{
                await transferVicepresident(communityId, userId);
            }
            await refreshUser();
            onSuccess();
            handleClose();
        }
        catch (err: any){
            setError(err.response?.data?.error?.message || 'Error al transferir rol');
        }
    };

    //Limpia el formulario al cerrar
    const handleClose = () => {
        setConfirmText('');
        setError('');
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        Transferir {transferType === 'president' ? 'presidencia' : 'vicepresidencia'} a {memberAlias}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <div className='bg-red-50 border border-red-200 rounded-lg p-3'>
                        <p className="text-sm text-red-700 font-medium">⚠️ Esta acción es irreversible.</p>
                        <p className="text-sm text-red-600 mt-1">
                            {transferType === 'president' ? 'Perderás tu rol de presidente y pasarás a ser vecino. Esta acción no se puede deshacer.' : 'Perderas tu rol de vicepresidente y pasarás a ser vecino.'}
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label>Escribe <strong>{expectedText}</strong> para confirmar</Label>
                        <Input value={confirmText} onChange={(e) => setConfirmText(e.target.value)} placeholder={expectedText}></Input>
                    </div>
                    {error && <p className='text-sm text-red-500'>{error}</p>}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={handleClose}>Cancelar</Button>
                     <Button onClick={handleSubmit} disabled={confirmText !== expectedText} className='bg-red-600 hover:bg-red-700'>Transferir</Button>
                </DialogFooter>

            </DialogContent>
        </Dialog>
    );
};

export default TransferRoleModal;