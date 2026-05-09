//Modal de confirmación para cancelar una reserva con campo de motivo opcional
import React, {useState} from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../dialog';
import { Button } from '../button';
import { Label } from '../label';
import { AlertTriangle } from 'lucide-react';

interface CancelBookingModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (reason?: string) => void;
}

const CancelBookingModal: React.FC<CancelBookingModalProps> = ({isOpen, onClose, onConfirm}) => {
    const [reason, setReason] = useState('');

    //Confirma la cancelación enviando el motivo (si lo hay) y limpia el formulario
    const handleConfirm = () => {
        onConfirm(reason.trim() || undefined);
        setReason('');
    };

    //Resetea el modal a los valores iniciales una vez se cierra
    const handleClose = () => {
        setReason('');
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
            <DialogContent className='sm:max-w-[450px]'>
                <DialogHeader>
                    <DialogTitle>Cancelar reserva</DialogTitle>
                </DialogHeader>

                <div className='py-4'>
                    <div className='flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl mb-4'>
                        <AlertTriangle className='h-6 w-6 text-amber-600 shrink-0' />
                        <p className='text-sm text-amber-800'>¿Estás seguro de que quieres cancelar esta reserva? Esta acción no se puede deshacer.</p>
                    </div>

                    <div className='flex flex-col gap-2'>
                        <Label className='font-bold text-sm'>Motivo <span className='text-xs font-normal text-gray-400'>(opcional)</span></Label>
                        <textarea className='w-full min-h-[80px] border border-gray-200 rounded-md p-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none' value={reason} onChange={(e) => setReason(e.target.value)} />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={handleClose}>Volver</Button>
                    <Button variant="destructive" onClick={handleConfirm} className='bg-red-600 hover:bg-red-700'>Confirmar cancelación</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default CancelBookingModal;