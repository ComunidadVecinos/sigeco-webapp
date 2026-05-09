//Modal para expulsar a un miembro: requiere escribir el alias para confirmar
import React, {useState} from 'react';
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter} from "@/components/ui/dialog";
import { Button } from '../button';
import { Label } from '../label';
import { Input } from '../input';
import { expelMember } from '@/services/adminService';

interface ExpelMemberModalProps {
    isOpen: boolean;
    onClose: () => void;
    communityId: string;
    userId: string;
    memberAlias: string;
    onSuccess: () => void;
}

const ExpelMemberModal: React.FC<ExpelMemberModalProps> = ({isOpen, onClose, communityId, userId, memberAlias, onSuccess}) => {
    const [confirmText, setConfirmText] = useState('');
    const [error, setError] = useState('');

    //Comprueba que el texto coincida con el alias del miembro y envía la petición de expulsión
    const handleSubmit = async () => {
        setError('');
        if(confirmText !== memberAlias){
            setError('El texto no coincide con el alias del miembro.');
            return;
        }
        try{
            await expelMember(communityId, userId);
            onSuccess();
            handleClose();
        }
        catch(err: any){
            setError(err.response?.data?.error?.message || 'Error al expulsar miembro');
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
                        Expulsar a {memberAlias}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <p className="text sm text-red-700 font-medium">
                            ⚠️ Esta acción es irreversible.
                        </p>
                        <p className="text-sm text-red-600 mt-1">Se eliminarán sus reservas, calendario y votaciones. Sus publicaciones en el foro, tablón e incidencias serán anonimizadas.</p>
                    </div>
                    <div className="space-y-2">
                        <Label>Escribe <strong>{memberAlias}</strong> para confirmar</Label>
                        <Input 
                            value={confirmText}
                            onChange={(e) => setConfirmText(e.target.value)}
                            placeholder={memberAlias}
                        />
                    </div>

                    {error && <p className='text-sm text-red-500'>{error}</p>}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={handleClose}>Cancelar</Button>
                    <Button onClick={handleSubmit} disabled={confirmText !== memberAlias} className="bg-red-600 hover:bg-red-700">Expulsar
                    </Button>
                </DialogFooter>

            </DialogContent>
        </Dialog>
    );
};

export default ExpelMemberModal;