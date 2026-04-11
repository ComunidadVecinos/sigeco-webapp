import React from 'react';
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter} from '../dialog';
import {Button} from '../button';
import {AlertTriangle} from 'lucide-react';

interface ConfirmCloseVotingModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    votingTitle: string;
}

const ConfirmCloseVotingModal: React.FC<ConfirmCloseVotingModalProps> = ({isOpen, onClose, onConfirm, votingTitle}) => {
    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className='sm:max-w-[420px]'>
                <DialogHeader>
                    <DialogTitle className='flex items-center gap-2'>
                        <AlertTriangle className='h-5 w-5 text-amber-500' />
                        Cerrar votación
                    </DialogTitle>
                </DialogHeader>

                <div className="py-4">
                    <p className='text-sm text-gray-600 leading-relaxed'>¿Estás seguro que quieres cerrar la votación <span className='font-bold text-gray-900'>"{votingTitle}"</span>?</p>
                    <p className='text-sm text-gray-500 mt-3'>
                        Esta acción es irreversible. No se podrán emitir más votos.
                    </p>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancelar</Button>
                    <Button variant="destructive" onClick={onConfirm}>Cerrar votación</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default ConfirmCloseVotingModal;