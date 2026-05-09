//Modal genérico de confirmación con soporte para acciones asíncronas y estilo destructivo
import React, {useState} from 'react';
import {Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle} from '../dialog';
import {Button} from '../button';
import { AlertTriangle } from 'lucide-react';

interface ConfirmModalProps {
    isOpen: boolean;
    onClose : () => void;
    title: string;
    message: string;
    onConfirm: () => Promise<void> | void;
    confirmText?: string;
    cancelText?: string;
    isDestructive?: boolean;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({isOpen, onClose, title, message, onConfirm, confirmText = 'Aceptar', cancelText = 'Cancelar', isDestructive = false}) => {
    const  [loading, setLoading] = useState(false);

    //Ejecuta la acción de confirmación, gestiona el loading y cierra el modal al terminar
    const handleConfirm = async () => {
        setLoading(true);
        try{
            await onConfirm();
            onClose();
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        //Bloquea el cieere del modal mientras la acción está en curso
        <Dialog open={isOpen} onOpenChange={(open) => {if (!open && !loading) onClose();}}>
            <DialogContent className='sm:max-w-[400px]'>
                <DialogHeader className="flex flex-col items-center gap-2 mt-2">
                    <div className={`p-3 rounded-full ${isDestructive ? 'bg-red-100' : 'bg-yellow-100'}`}>
                        <AlertTriangle className={`w-8 h-8 ${isDestructive ? 'text-red-600' : 'text-yellow-600'}`} />
                    </div>
                    <DialogTitle className='text-xl font-bold text-center'>{title}</DialogTitle>
                </DialogHeader>

                <div className='py-2 text-center text-gray-600 dark:text-gray-300'>
                    <p>{message}</p>
                </div>

                <DialogFooter className='sm:justify-center flex gap-2 mt-4'>
                    <Button variant="outline" onClick={onClose} disabled={loading} className='w-full sm:w-auto'>
                        {cancelText}
                    </Button>
                    <Button onClick={handleConfirm} disabled={loading} className={`w-full sm:w-auto ${isDestructive ? 'bg-red-600 hover:bg-red-700 text-white' : ''}`}>
                        {loading ? 'Procesando...' : confirmText}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default ConfirmModal;