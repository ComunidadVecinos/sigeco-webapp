import React, {useState} from 'react';
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter} from "@/components/ui/dialog";
import { Button } from '../button';
import { Label } from '../label';
import { Input } from '../input';
import { deleteCommunity } from '@/services/adminService';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/authContext';
import { getApiErrorMessage, getApiFieldErrors } from '@/lib/formErrors';

interface DeleteCommunityModalProps{
    isOpen: boolean;
    onClose: () => void;
    communityId: string;
    communityName: string;
}

const DeleteCommunityModal: React.FC<DeleteCommunityModalProps> = ({isOpen, onClose, communityId, communityName}) => {
    const [confirmText, setConfirmText] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const navigate = useNavigate();
    const { refreshUser } = useAuth();
    const expectedText = 'ELIMINAR COMUNIDAD';

    const handleSubmit = async () => {
        setError('');

        const nextFieldErrors: Record<string, string> = {};

        if(confirmText !== expectedText){
            nextFieldErrors.confirmationText = 'Escribe exactamente el texto de confirmacion indicado.';
        }

        if(!password){
            nextFieldErrors.currentPassword = 'Introduce tu contrasena actual para confirmar.';
        }

        setFieldErrors(nextFieldErrors);

        if (Object.keys(nextFieldErrors).length > 0) {
            return;
        }

        try {
            await deleteCommunity(communityId, {confirmationText: confirmText, currentPassword: password});
            await refreshUser();
            navigate('/auth/me');
        }
        catch(err: any){
            const apiFieldErrors = getApiFieldErrors(err, { confirmationText: 'confirmationText', currentPassword: 'currentPassword' });

            if (Object.keys(apiFieldErrors).length > 0) {
                setFieldErrors(apiFieldErrors);
                return;
            }

            setError(getApiErrorMessage(err, 'No se ha podido eliminar la comunidad.'));
        }
    };

    const handleClose = () =>{
        setConfirmText('');
        setPassword('');
        setError('');
        setFieldErrors({});
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Eliminar comunidad</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <div className='rounded-lg border border-red-200 bg-red-50 p-3'>
                        <p className="text-sm font-medium text-red-700">PELIGRO: esta accion es permanente e irreversible.</p>
                        <p className="mt-1 text-sm text-red-600">
                            Se notificara a todos los miembros, se cancelaran las solicitudes,
                            se revocaran los accesos y se eliminaran los datos de la comunidad.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label>Escribe <strong>{expectedText}</strong> para confirmar la eliminacion de <strong>{communityName}</strong></Label>
                        <Input value={confirmText} onChange={(e) => {
                            setConfirmText(e.target.value);
                            setFieldErrors((prev) => ({ ...prev, confirmationText: '' }));
                        }} placeholder={expectedText}></Input>
                        {fieldErrors.confirmationText && <p className='text-sm text-red-500'>{fieldErrors.confirmationText}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="delete-community-password">Confirma tu contrasena</Label>
                        <Input id="delete-community-password" name="deleteCommunityPassword" type='password' autoComplete="current-password" value={password} onChange={(e) => {
                            setPassword(e.target.value);
                            setFieldErrors((prev) => ({ ...prev, currentPassword: '' }));
                        }} placeholder="Tu contrasena"></Input>
                        {fieldErrors.currentPassword && <p className='text-sm text-red-500'>{fieldErrors.currentPassword}</p>}
                    </div>

                    {error && <p className='text-sm text-red-500'>{error}</p>}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={handleClose}>Cancelar</Button>
                    <Button onClick={handleSubmit} className='bg-red-600 hover:bg-red-700'>Eliminar comunidad</Button>
                </DialogFooter>

            </DialogContent>
        </Dialog>
    );
};

export default DeleteCommunityModal;