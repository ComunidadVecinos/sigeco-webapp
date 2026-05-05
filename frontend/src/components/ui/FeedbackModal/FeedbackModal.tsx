import React from 'react';
import {Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle} from '../dialog';
import {Button} from '../button';
import { CheckCircle2, XCircle } from 'lucide-react';

interface FeedbackModalProps {
    isOpen: boolean;
    onClose: () => void;
    type: 'success' | 'error';
    message: string;
}

const FeedbackModal: React.FC<FeedbackModalProps> = ({isOpen, onClose, type, message}) => {

    const isSuccess = type === 'success';
    const Icon = isSuccess ? CheckCircle2 : XCircle;
    const iconColor = isSuccess ? 'text-green-500' : 'text-red-500';
    const title = isSuccess ? '¡Éxito!' : 'Error';

    return (
        <Dialog open={isOpen} onOpenChange={(open) => {if (!open) onClose();}}>
            <DialogContent className='sm:max-w-[400px} text-center'>
                <DialogHeader className='flex flex-col items-center gap-2'>
                    <Icon className={`w-16 h-16 ${iconColor} mt.4`} />
                    <DialogTitle className='text-xl font-bold'>{title}</DialogTitle>
                </DialogHeader>

                <div className='py-4 text-gray-700 dark:text-gray-300'>
                    <p>{message}</p>
                </div>

                <DialogFooter className='sm:justify-center'>
                    <Button onClick={onClose} className='min-w-[120px]'>Aceptar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );

};

export default FeedbackModal;