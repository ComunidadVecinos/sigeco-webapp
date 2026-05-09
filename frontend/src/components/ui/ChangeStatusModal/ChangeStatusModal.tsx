//Modal para cambiar el estado de una incidencia
import React, { useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../dialog';
import { Button } from '../button';
import { Label } from '../label';
import { updateIncidentStatus, IncidentStatus } from '@/services/incidentService';
import FeedbackModal from '@/components/ui/FeedbackModal/FeedbackModal';


interface ChangeStatusModalProps {
    isOpen: boolean;
    onClose: () => void;
    communityId: string;
    incidentId: string;
    currentStatus: IncidentStatus;
    onSuccess: () => void;
}

//Transiciones de estado permitidas desde cada estado actual
const transitions: Record<IncidentStatus, {value: 'inProgress' | 'resolved' | 'cancelled'; label: string}[]> = {
    pending: [
        {value: 'inProgress', label: 'En proceso'},
        {value: 'resolved', label: 'Resuelta'},
        {value: 'cancelled', label: 'Cancelada'}
    ],
    inProgress: [
        {value: 'resolved', label: 'Resuelta'},
        {value: 'cancelled', label: 'Cancelada'}
    ],
    resolved: [
        {value: 'inProgress', label: 'En proceso'},       
    ],
    cancelled: [
        {value: 'inProgress', label: 'En proceso'},
    ]
};

//Etiquetas para cada estado de incidencia
const statusLabels: Record<IncidentStatus, string> = {
    pending: 'Pendiente',
    inProgress: 'En proceso',
    resolved: 'Resuelta',
    cancelled: 'Cancelada'
};

const ChangeStatusModal: React.FC<ChangeStatusModalProps> = ({isOpen, onClose, communityId, incidentId, currentStatus, onSuccess}) => {
    const allowedTransitions = transitions[currentStatus] || [];
    const [nextStatus, setNextStatus] = useState<'inProgress' | 'resolved' | 'cancelled'>(allowedTransitions[0]?.value || 'inProgress');
    const [loading, setLoading] = useState(false);

    const [feedback, setFeedback] = useState<{isOpen: boolean, type: 'success' | 'error', message: string}>({isOpen: false, type: 'success', message: ''});
    const closeFeedback = () => setFeedback(prev => ({...prev, isOpen: false}));

    //Envía el cambio de estado al backend
    const handleSave = async () => {
        setLoading(true);
        try{
            await updateIncidentStatus(communityId, incidentId, {status: nextStatus});
            onClose();
            onSuccess();
        } catch (err: any) {
            setFeedback({isOpen: true, type: 'error', message: 'Error al cambiar el estado.'});
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => {if (!open) onClose();}}>
            <DialogContent className='sm:max-w-[460px]'>
                <DialogHeader>
                    <DialogTitle>Cambiar estado</DialogTitle>
                </DialogHeader>
                    <div className='grid gap-4 py-4'>
                        <p className='text-sm text-gray-600'>
                            Estado actual: <span className='font-bold'>{statusLabels[currentStatus]}</span>
                        </p>
                        <div className='flex flex-col gap-2'>
                            <Label className='font-bold'>Nuevo estado</Label>
                            <select className='border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white' value={nextStatus} onChange={(e) => setNextStatus(e.target.value as typeof nextStatus)}>
                                {allowedTransitions.map(o => (<option key={o.value} value={o.value}>{o.label}</option>))}
                            </select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={onClose}>Cancelar</Button>
                        <Button onClick={handleSave} disabled={loading || allowedTransitions.length === 0}>{loading ? 'Guardando...' : 'Cambiar estado'}
                        </Button>
                    </DialogFooter>
            </DialogContent>

                <FeedbackModal 
                    isOpen={feedback.isOpen}
                    type={feedback.type}
                    message={feedback.message}
                    onClose={closeFeedback}
                />

        </Dialog>
    );
};

export default ChangeStatusModal;