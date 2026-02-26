import React, {useState} from 'react';
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { requestProfileChange } from '@/services/communityServices';

interface EditCommunityInfoModalProps{
    isOpen: boolean;
    onClose: () => void;
    communityId: number;
    currentAlias: string;
    currentDomicile: {
        country: string;
        province: string;
        municipality: string;
        streetType: string;
        streetName: string;
        postalCode: string;
        number: string;
        block?: string;
        floor?: string;
        door?: string;
    };
}

const EditCommunityInfoModal: React.FC<EditCommunityInfoModalProps> = ({
    isOpen, onClose, communityId, currentAlias, currentDomicile
}) => {
    const [alias, setAlias] = useState(currentAlias);
    const [comentario, setComentario] = useState('');
    const [domicilio, setDomicilio] = useState({
        pais: currentDomicile.country,
        provincia: currentDomicile.province,
        municipio: currentDomicile.municipality,
        tipoVia: currentDomicile.streetType,
        nombreVia: currentDomicile.streetName,
        cp: currentDomicile.postalCode,
        numero: currentDomicile.number,
        bloque: currentDomicile.block || '',
        planta: currentDomicile.floor || '',
        puerta: currentDomicile.door || ''
    });

    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleDomicilioChange = (campo: string, valor: string) => {
        setDomicilio({...domicilio, [campo]: valor});
    };

    const handleSubmit = async () => {
        setError('');
        setSuccess('');
        try{
            await requestProfileChange(communityId, {
                alias,
                comment: comentario || undefined,
                domicile: {
                    country: domicilio.pais,
                    province: domicilio.provincia,
                    municipality: domicilio.municipio,
                    streetType: domicilio.tipoVia,
                    streetName: domicilio.nombreVia,
                    postalCode: domicilio.cp,
                    number: domicilio.numero,
                    block: domicilio.bloque || undefined,
                    floor: domicilio.planta || undefined,
                    door: domicilio.puerta || undefined
                }
            });
            setSuccess('Solicitud enviada. Pendiente de aprobación');
            setTimeout(() => onClose(), 2000);
        }catch(err: any){
            setError(err.response?.data?.error?.message || 'Error al enviar solicitud');
        }
    };

    const handleClose = () => {
        setError('');
        setSuccess('');
        setComentario('');
        onClose();
    }

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className='max-w-2xl'>
                <DialogHeader>
                    <DialogTitle>Solicitar cambio de información</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label>Alias</Label>
                        <Input value={alias} onChange={(e) => setAlias(e.target.value)}></Input>
                    </div>

                    <h5 className="font-bold">Domicilio</h5>

                    <div className="grid grid-cols-12 gap-3">
                        <div className="col-span-4 space-y-1">
                            <Label>País</Label>
                            <Input value={domicilio.pais} onChange={(e) => handleDomicilioChange('pais', e.target.value)}></Input>
                        </div>

                        <div className="col-span-4 space-y-1">
                            <Label>Provincia</Label>
                            <Input value={domicilio.provincia} onChange={(e) => handleDomicilioChange('provincia', e.target.value)}></Input>
                        </div>

                        <div className="col-span-4 space-y-1">
                            <Label>Municipio</Label>
                            <Input value={domicilio.municipio} onChange={(e) => handleDomicilioChange('municipio', e.target.value)}></Input>
                        </div>
                    </div>

                    <div className="grid grid-cols-12 gap-3">
                        <div className="col-span-6 space-y-1">
                            <Label>Tipo de vía</Label>
                            <Input value={domicilio.tipoVia} onChange={(e) => handleDomicilioChange('tipoVia', e.target.value)}></Input>
                        </div>

                        <div className="col-span-6 space-y-1">
                            <Label>Nombre de la vía</Label>
                            <Input value={domicilio.nombreVia} onChange={(e) => handleDomicilioChange('nombreVia', e.target.value)}></Input>
                        </div>
                    </div>


                    <div className="grid grid-cols-12 gap-3">
                        <div className="col-span-2 space-y-1">
                            <Label>C.P.</Label>
                            <Input value={domicilio.cp} onChange={(e) => handleDomicilioChange('cp', e.target.value)}></Input>
                        </div>

                        <div className="col-span-2 space-y-1">
                            <Label>Nº</Label>
                            <Input value={domicilio.numero} onChange={(e) => handleDomicilioChange('numero', e.target.value)}></Input>
                        </div>

                        <div className="col-span-2 space-y-1">
                            <Label>Bloque</Label>
                            <Input value={domicilio.bloque} onChange={(e) => handleDomicilioChange('bloque', e.target.value)}></Input>
                        </div>

                        <div className="col-span-3 space-y-1">
                            <Label>Planta</Label>
                            <Input value={domicilio.planta} onChange={(e) => handleDomicilioChange('planta', e.target.value)}></Input>
                        </div>

                        <div className="col-span-3 space-y-1">
                            <Label>Puerta</Label>
                            <Input value={domicilio.puerta} onChange={(e) => handleDomicilioChange('puerta', e.target.value)}></Input>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Comentario para el administrador (opcional)</Label>
                        <textarea 
                            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            value={comentario}
                            onChange={(e) => setComentario(e.target.value)}
                            placeholder="Motivo del cambio..."
                            rows={3}
                        />
                    </div>

                    {error && <p className='text-sm text-red-500'>{error}</p>}
                    {success && <p className='text-sm text-green-500'>{success}</p>}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={handleClose}>Cancelar</Button>
                    <Button onClick={handleSubmit}>Enviar solicitud</Button>
                </DialogFooter>

            </DialogContent>
        </Dialog>
    );
};

export default EditCommunityInfoModal;