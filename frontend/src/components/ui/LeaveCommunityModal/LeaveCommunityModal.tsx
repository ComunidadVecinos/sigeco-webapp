import React, {useState} from 'react';
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter} from '../dialog';
import {Button} from '../button';
import { leaveCommunity } from '@/services/communityServices';
import FeedbackModal from '@/components/ui/FeedbackModal/FeedbackModal';


interface LeaveCommunityModalProps {
    isOpen: boolean;
    onClose: () => void;
    communityId: string;
    communityName: string;
    onSuccess: () => void;
}

const LeaveCommunityModal: React.FC<LeaveCommunityModalProps> = ({isOpen, onClose, communityId, communityName, onSuccess}) => {
    const [loading, setLoading] = useState(false);

    const [feedback, setFeedback] = useState<{isOpen: boolean, type: 'success' | 'error', message: string}>({isOpen: false, type: 'success', message: ''});
    const closeFeedback = () => setFeedback(prev => ({...prev, isOpen: false}));

    const handleLeave = async () => {
        setLoading(true);
        try{
            await leaveCommunity(communityId);
            onClose();
            onSuccess();
        } catch(err: any) {
            setFeedback({isOpen: true, type: 'error', message: 'No se pudo abandonar la comunidad.'});
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className='sm:max-w-[440px]'>
                <DialogHeader>
                    <DialogTitle>Abandonar comunidad</DialogTitle>
                </DialogHeader>

                <div className='py-4'>
                    <p className='text-sm text-gray-600'>
                        ¿Estás seguro de que quieres abandonar <span className='font-bold'>{communityName}</span>?
                    </p>
                    <p className='text-sm text-gray-500 mt-2'>
                        Perderás el acceso a todos los recursos de esta comunidad. Para volver a unirte necesitarás un nuevo código de acceso.
                    </p>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={loading}>Cancelar</Button>
                    <Button className='bg-red-600 hover:bg-red-700 text-white' onClick={handleLeave} disabled={loading}>
                        {loading ? 'Abandonando...' : 'Abandonar comunidad'}
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

export default LeaveCommunityModal;