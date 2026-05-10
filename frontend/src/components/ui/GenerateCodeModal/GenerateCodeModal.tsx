//Modal para gestionar el código de acceso de la comunidad: visualizar, regenerar y copiar al portapapeles
import React, {useState, useEffect} from 'react';
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter} from '../dialog';
import { Button } from '../button';
import { regenerateAccessCode } from '@/services/adminService';
import { Copy, RefreshCw, Check, Eye, EyeOff } from 'lucide-react';
import FeedbackModal from '@/components/ui/FeedbackModal/FeedbackModal';


interface GenerateCodeModalProps {
    isOpen: boolean;
    onClose: () => void;
    communityId: string;
    currentAccessCode?: string | null;
    onCodeRegenerated?: (newCode: string) => void;
}

const GenerateCodeModal: React.FC<GenerateCodeModalProps> = ({isOpen, onClose, communityId, currentAccessCode, onCodeRegenerated}) => {
    const [accessCode, setAccessCode] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [visible, setVisible] = useState(false);

    const [feedback, setFeedback] = useState<{isOpen: boolean, type: 'success' | 'error', message: string}>({isOpen: false, type: 'success', message: ''});
    const closeFeedback = () => setFeedback(prev => ({...prev, isOpen: false}));

    //Carga el código actual al abrir el modal
    useEffect(() => {
        if(isOpen) {
            setAccessCode(currentAccessCode || null);
            setError(null);
            setCopied(false);
        }
    }, [isOpen, currentAccessCode]);

    //Oculat el código cada vez que se abre el modal
    useEffect(() => {
        if(isOpen) {
            setVisible(false);
        }
    }, [isOpen]);
   

    //Regenera el código de acceso en el backend y lo muestra autómaticamente
    const generate = async () => {
        if(!communityId) return;
        setLoading(true);
        setError(null);
        setCopied(false);

        try{
            const res = await regenerateAccessCode(communityId);
            setAccessCode(res.data.community.accessCode);
            if(onCodeRegenerated){
                onCodeRegenerated(res.data.community.accessCode);
            }
            setVisible(true);
        } catch (err: any){
            setError(err.response?.data?.error?.message || 'Error al generar el código de acceso.');
        } finally {
            setLoading(false);
        }
    };

    //Copia el código al portapapeles del navegador
    const handleCopy = async () => {
        if(!accessCode) return;
        try{
            await navigator.clipboard.writeText(accessCode);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            setFeedback({isOpen: true, type: 'error', message: 'No se pudo copiar al portapapeles.'});
        }
    };

    //Oculta el código con asteriscos cuando esta oculto
    const maskedCode = accessCode ? accessCode.replace(/./g, '*') : null;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className='sm:max-w-[420px]'>
                <DialogHeader>
                    <DialogTitle>Código de Acceso</DialogTitle>
                </DialogHeader>

                <div className="py-6 text-center">
                    <p className="text-sm text-gray-500 mb-4">
                        Comparte este código con los vecinos que quieran unirse a la comunidad.
                    </p>

                    {loading && <p className='text-sm text-gray-400'>Genernado código...</p>}
                    {error && <p className='text-sm text-red-500'>{error}</p>}

                    {accessCode && !loading && (
                        <div className='bg-gray-50 border border-gray-200 rounded-xl p-6 inline-flex items-center gap-3'>
                            <span className='text-3xl font-mono font-bold tracking-[0.3em] text-gray-900'>
                                {visible ? accessCode : maskedCode}
                            </span>
                        
                            <button onClick={() => setVisible(!visible)} className='p-1.5 hover:bg-gray-200 rounded-md transition-colors' title={visible ? 'Ocultar código' : 'Mostrar código'}>
                                {visible ? <EyeOff className='h-5 w-5 text-gray-500' /> : <Eye className='h-5 w-5 text-gray-500' />}
                            </button>
                        </div>
                    )}

                    {!accessCode && !loading && !error && (
                        <p className="text-sm text-gray-400 mt-2">No hay código de acceso activo. Pulsa "Regenerar" para crear uno nuevo.</p>
                    )}
                </div>

                <DialogFooter className='flex gap-2 sm:justify-center'>
                    <Button variant="outline" size="sm" onClick={handleCopy} disabled={!accessCode || loading || !visible}>
                        {copied ? <Check className='h-4 w-4 mr-2' /> : <Copy className='h-4 w-4 mr-2' />}
                        {copied ? 'Copiado' : 'Copiar'}
                    </Button>
                    <Button variant="outline" size="sm" onClick={generate} disabled={loading}>
                        <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Regenerar
                    </Button>
                    <Button variant="outline" size="sm" onClick={onClose}>Cerrar</Button>
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

export default GenerateCodeModal;