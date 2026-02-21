import React from 'react';
import {Dialog, DialogContent, DialogFooter} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from 'lucide-react';

interface DeleteAccountModalProps{
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({isOpen, onClose, onConfirm}) => {

    return (
        <Dialog open={isOpen} onOpenChange={(open) => {if(!open) onClose(); }}>
            <DialogContent className="sm:max-w-sm">
                <div className="text-center py-4">
                    <AlertTriangle className="h-12 w-12 text-red-500 mx-auto"/>
                    <h5 className='font-bold mt-3'>Eliminar cuenta</h5>
                    <h6 className="text-muted-foreground text-sm">Esta acción es irreversible</h6>
                    <p className="mt-3 text-sm">
                        Al eliminar tu cuenta, perderás el acceso a todas tus comunidades y tu información personal será eliminada permanentemente.
                    </p>
                </div>
                <DialogFooter className="justify-center">
                    <Button variant="secondary" size="sm" onClick={onClose}>No, cancelar</Button>
                    <Button variant="destructive" size="sm" onClick={onConfirm}>Sí, eliminar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default DeleteAccountModal;