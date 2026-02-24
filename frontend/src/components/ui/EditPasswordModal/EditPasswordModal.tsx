import React, {useState} from "react";
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter} from "@/components/ui/dialog";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";

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


    const handleSubmit = async () => {
        setError('');

        //Validar que la nueva no se igual que la actual
        if(newPassword === currentPassword){
            setError('La nueva contraseña no puede ser igual a la actual');
            return;
        }

        //Validar longittud minima 
        if(newPassword.length < 8){
            setError('La contraseña debe tener al menos 8 caracteres');
            return;
        }

        //Validar mayuscula
        if(!/[A-Z]/.test(newPassword)){
            setError('La contraseña debe tener al menos una mayúscula');
            return;
        }

        //Validar número
        if(!/[0-9]/.test(newPassword)){
            setError('La contraseña debe tener al menos un número');
            return;
        }

        //Validar carácter especial
        if(!/[!@#$%^&*(),.?":{}|<>]/.test(newPassword)){
            setError('La contraseña debe tener al menos un carácter especial (!@#$%^&*(),.?":{}|<>');
            return;
        }

        //Validar que coinciden
        if(newPassword !== confirmPassword){
            setError('Las contraseñas nuevas no coinciden');
            return;
        }

        try{
            await onSave(currentPassword, newPassword);
            handleClose();
        }catch(err:any){
            setError(err.response?.data?.error?.message || 'Error al cambiar la contraseña');
        }
    };
    
    const handleClose = () => {
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setError('');
        onClose();
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => {if(!open) handleClose(); }}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Cambiar contraseña</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">{error}</div>}
                    <div className="space-y-2">
                        <Label>Contraseña actual</Label>
                        <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Introduce tu contraseña actual"></Input>
                    </div>
                    <div className="space-y-2">
                        <Label>Nueva contraseña</Label>
                        <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Introduce la nueva contraseña"></Input>
                    </div>
                    <div className="space-y-2">
                        <Label>Confirmar nueva contraseña</Label>
                        <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repita la nueva contraseña"></Input>
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
