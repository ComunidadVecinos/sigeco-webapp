import React, {useState, useEffect} from 'react';
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter} from '../dialog';
import { Button } from '../button';
import { regenerateAccessCode } from '@/services/adminService';
import { Copy, RefreshCw, Check } from 'lucide-react';

interface GenerateCodeModalProps {
    isOpen: boolean;
    onClose: () => void;
    communityId: string;
}

const GenerateCodeModal: React.FC<GenerateCodeModalProps> = ({isOpen, onClose, communityId}) => {
    const [accessCode, setAccessCode] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const generate = async () => {
        if(!communityId) return;
        setLoading(true);
        setError(null);
        setCopied(false);

        try{
            const res = await regenerateAccessCode(communityId);
            setAccessCode(res.data.community.accessCode);
        } catch (err: any){
            setError(err.response?.data?.error?.message || 'Error al generar el código de acceso.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if(isOpen) {
            setAccessCode(null);
            setError(null);
            setCopied(false);
            generate();
        }
    }, [isOpen]);

    const handleCopy = async () => {
        if(!accessCode) return;
        try{
            await navigator.clipboard.writeText(accessCode);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            alert('No se pudo copiar al portapapeles.');
        }
    };

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
                        <div className='g-gray-50 border border-gray-200 rounded-xl p-6 inline-block'>
                            <span className='text-3xl font-mono font-bold tracking-[0.3em] text-gray-900'>
                                {accessCode}
                            </span>
                        </div>
                    )}
                </div>

                <DialogFooter className='flex gap-2 sm:justify-center'>
                    <Button variant="outline" size="sm" onClick={handleCopy} disabled={!accessCode || loading}>
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
        </Dialog>
    );
};

export default GenerateCodeModal;