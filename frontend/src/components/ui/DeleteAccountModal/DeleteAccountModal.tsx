//Modal de eliminación de cuenta
import React, {useState} from 'react';
import {Dialog, DialogContent, DialogFooter} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertTriangle } from 'lucide-react';
import { deleteAccount } from '@/services/userServices';
import { getApiErrorMessage, getApiFieldErrors } from '@/lib/formErrors';

interface DeleteAccountModalProps{
    isOpen: boolean;
    onClose: () => void;
    userEmail: string;
    onConfirm: () => void;
}

const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({isOpen, onClose, userEmail, onConfirm}) => {

    const [confirmText, setConfirmText] = useState('');
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    //Texto de confirmación que el usuario debe escribir exactamente para desbloquear la acción
    const expectedText = 'ELIMINAR MI CUENTA';

    //Comprueba que el texto coincida, envía la petición de eliminación y mapea errores de la API
    const handleDelete = async () => {
        setError('');

        if(confirmText !== expectedText){
            setFieldErrors({ confirmationText: `Escribe exactamente "${expectedText}".` });
            return;
        }

        setFieldErrors({});

        try {
            await deleteAccount(userEmail, confirmText);
            onConfirm();
        } 
        catch (err: any){
            const apiFieldErrors = getApiFieldErrors(err, { confirmationText: 'confirmationText' });

            if (Object.keys(apiFieldErrors).length > 0) {
                setFieldErrors(apiFieldErrors);
                return;
            }

            setError(getApiErrorMessage(err, 'No se ha podido eliminar la cuenta.'));
        }
    };

    //Limpia todos los campos y errores al cerrar el modal
    const handleClose = () =>{
        setConfirmText('');
        setError('');
        setFieldErrors({});
        onClose();
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => {if(!open) handleClose(); }}>
            <DialogContent className="sm:max-w-sm">
                <div className="py-4 text-center">
                    <AlertTriangle className="mx-auto h-12 w-12 text-red-500"/>
                    <h5 className='mt-3 font-bold'>Eliminar cuenta</h5>
                    <h6 className="text-sm text-muted-foreground">Esta accion es irreversible</h6>
                    <p className="mt-3 text-sm">
                        Al eliminar tu cuenta, perderás el acceso a todas tus comunidades y tu información personal será eliminada permanentemente.
                    </p>
                </div>
                <div className="space-y-2">
                    <Label>Escribe <strong>{expectedText}</strong> para confirmar</Label>
                    <Input value={confirmText} onChange={(e) => {
                        setConfirmText(e.target.value);
                        setFieldErrors((prev) => ({ ...prev, confirmationText: '' }));
                    }} placeholder={expectedText}></Input>
                    {fieldErrors.confirmationText && <p className='text-sm text-red-500'>{fieldErrors.confirmationText}</p>}
                    {error && <p className='text-sm text-red-500'>{error}</p>}
                </div>
                <DialogFooter className="justify-center">
                    <Button variant="secondary" size="sm" onClick={handleClose}>Cancelar</Button>
                    <Button variant="destructive" size="sm" onClick={handleDelete}>Eliminar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default DeleteAccountModal;