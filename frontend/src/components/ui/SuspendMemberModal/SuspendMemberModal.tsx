import React, {useState} from 'react';
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter} from "@/components/ui/dialog";
import { Button } from '../button';
import { Label } from '../label';
import { Input } from '../input';
import { suspendMember } from '@/services/adminService';

interface SuspendMemberModalProps {
    isOpen: boolean;
    onClose: () => void;
    communityId: number;
    userId: number;
    memberAlias: string;
    onSuccess: () => void;
}

const SuspendMemberModal: React.FC<SuspendMemberModalProps> = ({isOpen, onClose, communityId, userId, memberAlias, onSuccess}) => {
    const [endDate, setEndDate] = useState('');
    const [comment, setCommnet] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSubmit = async () => {
        setError('');
        setSuccess('');

        if(!endDate) {
            setError('La fecha de fin es requerida');
            return;
        }

        try{
            await suspendMember(communityId, userId, {endDate, comment:comment || undefined});
            setSuccess('Miembro suspendido correctamente.');
            onSuccess();
            setTimeout(() => {handleClose();}, 1500);
        }catch(err: any){
            setError(err.response?.data?.error?.message || 'Error al suspender miembro');
        }
    };

    const handleClose = () => {
        setEndDate('');
        setCommnet('');
        setError('');
        setSuccess('');
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
                        El miembro perderá acceso a: Foro, Incidencias y Reservas.
                        Mantendrá acceso a: Tablón, Ayuda, Calendario y Votaciones.
                    </p>
                    <div className="space-y-2">
                        <Label>Fecha de fin de suspensión</Label>
                        <Input 
                            type='date'
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Comentario (opcional)</Label>
                        <textarea 
                            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            value={comment}
                            onChange={(e) => setCommnet(e.target.value)}
                            placeholder='Motivo de la suspensión...'
                            rows={3}
                        />
                    </div>

                    {error && <p className='text-sm text-red-500'>{error}</p>}
                    {success && <p className='text-sm text-green-500'>{success}</p>}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={handleClose}>Cancelar</Button>
                    <Button onClick={handleSubmit} className="bg-yellow-600 hover:bg-yellow-700">Suspender
                    </Button>
                </DialogFooter>

            </DialogContent>
        </Dialog>
    );
};

export default SuspendMemberModal;