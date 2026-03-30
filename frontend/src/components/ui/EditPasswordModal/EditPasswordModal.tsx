import React, {useState} from "react";
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter} from "@/components/ui/dialog";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import { getApiErrorMessage, getApiFieldErrors } from '@/lib/formErrors';

interface EditPasswordModalProps{
    isOpen: boolean;
    onClose: () => void;
    onSave: (currentPassword: string, newPassword: string) => Promise<void>;
}

const EditPasswordModal: React.FC<EditPasswordModalProps> = ({isOpen, onClose, onSave}) => {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    const handleSubmit = async () => {
        setError('');

        const nextFieldErrors: Record<string, string> = {};

        if(!currentPassword){
            nextFieldErrors.currentPassword = 'Introduce tu contrasena actual.';
        }

        if(!newPassword){
            nextFieldErrors.newPassword = 'Introduce una nueva contrasena.';
        } 
        else if(newPassword === currentPassword){
            nextFieldErrors.newPassword = 'La nueva contrasena no puede ser igual a la actual.';
        } 
        else if(newPassword.length < 8){
            nextFieldErrors.newPassword = 'La contrasena debe tener al menos 8 caracteres.';
        } 
        else if(!/[A-Z]/.test(newPassword)){
            nextFieldErrors.newPassword = 'La contrasena debe tener al menos una mayuscula.';
        } 
        else if(!/[0-9]/.test(newPassword)){
            nextFieldErrors.newPassword = 'La contrasena debe tener al menos un numero.';
        } 
        else if(!/[!@#$%^&*(),.?":{}|<>]/.test(newPassword)){
            nextFieldErrors.newPassword = 'La contrasena debe tener al menos un caracter especial.';
        }

        if(!confirmPassword){
            nextFieldErrors.confirmPassword = 'Confirma la nueva contrasena.';
        } else if(newPassword !== confirmPassword){
            nextFieldErrors.confirmPassword = 'Las nuevas contrasenas no coinciden.';
        }

        setFieldErrors(nextFieldErrors);

        if(Object.keys(nextFieldErrors).length > 0){
            return;
        }

        try{
            await onSave(currentPassword, newPassword);
            handleClose();
        }catch(err:any){
            const apiFieldErrors = getApiFieldErrors(err, {
                currentPassword: 'currentPassword',
                newPassword: 'newPassword',
                newPasswordConfirmation: 'confirmPassword'
            });

            if (Object.keys(apiFieldErrors).length > 0) {
                setFieldErrors(apiFieldErrors);
                return;
            }

            setError(getApiErrorMessage(err, 'No se ha podido cambiar la contrasena.'));
        }
    };

    const handleClose = () => {
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setError('');
        setFieldErrors({});
        onClose();
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => {if(!open) handleClose(); }}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Cambiar contrasena</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
                    <div className="space-y-2">
                        <Label htmlFor="current-password">Contrasena actual</Label>
                        <Input id="current-password" name="currentPassword" type="password" autoComplete="current-password" value={currentPassword} onChange={(e) => {
                            setCurrentPassword(e.target.value);
                            setFieldErrors((prev) => ({ ...prev, currentPassword: '' }));
                        }} placeholder="Introduce tu contrasena actual"></Input>
                        {fieldErrors.currentPassword && <p className='text-sm text-red-500'>{fieldErrors.currentPassword}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="new-password">Nueva contrasena</Label>
                        <Input id="new-password" name="newPassword" type="password" autoComplete="new-password" value={newPassword} onChange={(e) => {
                            setNewPassword(e.target.value);
                            setFieldErrors((prev) => ({ ...prev, newPassword: '' }));
                        }} placeholder="Introduce la nueva contrasena"></Input>
                        {fieldErrors.newPassword && <p className='text-sm text-red-500'>{fieldErrors.newPassword}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="confirm-new-password">Confirmar nueva contrasena</Label>
                        <Input id="confirm-new-password" name="confirmPassword" type="password" autoComplete="new-password" value={confirmPassword} onChange={(e) => {
                            setConfirmPassword(e.target.value);
                            setFieldErrors((prev) => ({ ...prev, confirmPassword: '' }));
                        }} placeholder="Repite la nueva contrasena"></Input>
                        {fieldErrors.confirmPassword && <p className='text-sm text-red-500'>{fieldErrors.confirmPassword}</p>}
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="secondary" onClick={handleClose}>Cerrar</Button>
                    <Button onClick={handleSubmit}>Guardar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default EditPasswordModal;