import React, {useState} from 'react';
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter} from "@/components/ui/dialog";
import { Button } from '../button';
import { Label } from '../label';
import { approveRequest, rejectRequest } from '@/services/adminService';
import { getApiErrorMessage, getApiFieldErrors } from '@/lib/formErrors';

interface RequestActionModalProps {
    isOpen: boolean;
    onClose: () => void;
    action: 'approve' | 'reject';
    communityId: string;
    requestId: string;
    onSuccess: () => void;
}

const RequestActionModal: React.FC<RequestActionModalProps> = ({isOpen, onClose, action, communityId, requestId, onSuccess}) => {
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    const handleSubmit = async () => {
        setError('');
        setSuccess('');
        setFieldErrors({});

        try{
            if(action === 'approve'){
                await approveRequest(communityId, requestId, message || undefined);
            }
            else {
                await rejectRequest(communityId, requestId, message || undefined);
            }
            setSuccess(action === 'approve' ? 'Solicitud aceptada.' : 'Solicitud rechazada.');
            onSuccess();
            setTimeout(() => {onClose(); setMessage(''); setSuccess('');}, 1500);
        }
        catch(err: any){
            const apiFieldErrors = getApiFieldErrors(err, {
                resolutionMessage: 'message'
            });

            if (Object.keys(apiFieldErrors).length > 0) {
                setFieldErrors(apiFieldErrors);
                return;
            }

            setError(getApiErrorMessage(err, 'No se ha podido procesar la solicitud.'));
        }
    };

    const handleClose = () => {
        setMessage('');
        setError('');
        setSuccess('');
        setFieldErrors({});
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        {action === 'approve' ? 'Aceptar solicitud' : 'Rechazar solicitud'}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label>Mensaje para el solicitante (opcional)</Label>
                        <textarea
                            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            value={message}
                            onChange={(e) => {
                                setMessage(e.target.value);
                                setFieldErrors((prev) => ({ ...prev, message: '' }));
                            }}
                            placeholder={action === 'approve' ? 'Bienvenido a la comunidad...' : 'Motivo de rechazo...'}
                            rows={3}
                        />
                        {fieldErrors.message && <p className='text-sm text-red-500'>{fieldErrors.message}</p>}
                    </div>

                    {error && <p className='text-sm text-red-500'>{error}</p>}
                    {success && <p className='text-sm text-green-500'>{success}</p>}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={handleClose}>Cancelar</Button>
                    <Button onClick={handleSubmit} className={action === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}>
                        {action === 'approve' ? 'Aceptar' : 'Rechazar'}
                    </Button>
                </DialogFooter>

            </DialogContent>
        </Dialog>
    );
};

export default RequestActionModal;