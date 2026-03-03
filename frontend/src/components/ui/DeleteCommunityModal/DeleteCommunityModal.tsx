import React, {useState} from 'react';
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter} from "@/components/ui/dialog";
import { Button } from '../button';
import { Label } from '../label';
import { Input } from '../input';
import { deleteCommunity } from '@/services/adminService';
import { useNavigate } from 'react-router-dom';

interface DeleteCommunityModalProps{
    isOpen: boolean;
    onClose: () => void;
    communityId: number;
    communityName: string;
}

const DeleteCommunityModal: React.FC<DeleteCommunityModalProps> = ({isOpen, onClose, communityId, communityName}) => {
    const [confirmText, setConfirmText] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async () => {
        setError('');
        if(confirmText !== communityName){
            setError('El nombre no coincide.');
            return;
        }
        if(!password){
            setError('La contraseña es requerida');
            return;
        }
        try{
            await deleteCommunity(communityId, {confirmText, password});
            navigate('/auth/me');
        }catch(err: any){
            setError(err.response?.data?.error?.message || 'Error al eliminar comunidad');
        }
    };

    const handleClose = () =>{
        setConfirmText('');
        setPassword('');
        setError('');
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Eliminar comunidad</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <div className='bg-red-50 border border-red-200 rounded-lg p-3'>
                        <p className="text-sm text-red-700 font-medium">🚨 PELIGRO: Esta acción es permanente e irreversible.</p>
                        <p className="text-sm text-red-600 mt-1">
                            Se notificará a todos los miembros, se cancelarán todas las solicitudes,
                            se revocarán los accesos y se eliminarán todos los datos de la comunidad.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label>Escribe el nombre de la comunidad: <strong>{communityName}</strong></Label>
                        <Input value={confirmText} onChange={(e) => setConfirmText(e.target.value)} placeholder={communityName}></Input>
                    </div>

                     <div className="space-y-2">
                        <Label>Confirma tu contraseña</Label>
                        <Input type='password' value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Tu contraseña"></Input>
                    </div>

                    {error && <p className='text-sm text-red-500'>{error}</p>}
                </div> 

                <DialogFooter>
                    <Button variant="outline" onClick={handleClose}>Cancelar</Button>
                    <Button onClick={handleSubmit} disabled={confirmText !== communityName || !password} className='bg-red-600 hover:bg-red-700'>Eliminar comunidad</Button>
                </DialogFooter>

            </DialogContent>
        </Dialog>
    );
};

export default DeleteCommunityModal;