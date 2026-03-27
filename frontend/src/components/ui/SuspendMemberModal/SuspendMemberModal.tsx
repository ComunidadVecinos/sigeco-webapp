import React, {useState} from 'react';
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter} from "@/components/ui/dialog";
import { Button } from '../button';
import { Label } from '../label';
import { Input } from '../input';
import { suspendMember } from '@/services/adminService';
import { getApiErrorMessage, getApiFieldErrors } from '@/lib/formErrors';

interface SuspendMemberModalProps {
    isOpen: boolean;
    onClose: () => void;
    communityId: string;
    userId: string;
    memberAlias: string;
    onSuccess: () => void;
}

const SuspendMemberModal: React.FC<SuspendMemberModalProps> = ({isOpen, onClose, communityId, userId, memberAlias, onSuccess}) => {
    const [endDate, setEndDate] = useState('');
    const [comment, setComment] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    const handleSubmit = async () => {
        setError('');
        setSuccess('');

        const nextFieldErrors: Record<string, string> = {};

        if(!endDate) {
            nextFieldErrors.endDate = 'Selecciona la fecha de fin de la suspension.';
        }

        setFieldErrors(nextFieldErrors);

        if (Object.keys(nextFieldErrors).length > 0) {
            return;
        }

        try{
            await suspendMember(communityId, userId, {endDate, comment:comment || undefined});
            setSuccess('Miembro suspendido correctamente.');
            onSuccess();
            setTimeout(() => {handleClose();}, 1500);
        }
        catch(err: any){
            const apiFieldErrors = getApiFieldErrors(err, {
                suspendedUntil: 'endDate',
                suspensionReason: 'comment'
            });

            if (Object.keys(apiFieldErrors).length > 0) {
                setFieldErrors(apiFieldErrors);
                return;
            }

            setError(getApiErrorMessage(err, 'No se ha podido suspender al miembro.'));
        }
    };

    const handleClose = () => {
        setEndDate('');
        setComment('');
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
                        Suspender a {memberAlias}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <p className="text-sm text-gray-500">
                        El miembro perdera acceso a foro, incidencias y reservas.
                        Mantendra acceso a tablon, ayuda, calendario y votaciones.
                    </p>
                    <div className="space-y-2">
                        <Label>Fecha de fin de suspension</Label>
                        <Input
                            type='date'
                            value={endDate}
                            onChange={(e) => {
                                setEndDate(e.target.value);
                                setFieldErrors((prev) => ({ ...prev, endDate: '' }));
                            }}
                            min={new Date().toISOString().split('T')[0]}
                        />
                        {fieldErrors.endDate && <p className='text-sm text-red-500'>{fieldErrors.endDate}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label>Comentario (opcional)</Label>
                        <textarea
                            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            value={comment}
                            onChange={(e) => {
                                setComment(e.target.value);
                                setFieldErrors((prev) => ({ ...prev, comment: '' }));
                            }}
                            placeholder='Motivo de la suspension...'
                            rows={3}
                        />
                        {fieldErrors.comment && <p className='text-sm text-red-500'>{fieldErrors.comment}</p>}
                    </div>

                    {error && <p className='text-sm text-red-500'>{error}</p>}
                    {success && <p className='text-sm text-green-500'>{success}</p>}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={handleClose}>Cancelar</Button>
                    <Button onClick={handleSubmit} className="bg-yellow-600 hover:bg-yellow-700">Suspender</Button>
                </DialogFooter>

            </DialogContent>
        </Dialog>
    );
};

export default SuspendMemberModal;