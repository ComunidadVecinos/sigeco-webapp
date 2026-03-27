import React, {useEffect, useState} from 'react';
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { requestProfileChange } from '@/services/communityServices';
import { getApiErrorMessage, getApiFieldErrors } from '@/lib/formErrors';
import { isValidSpanishPostalCode, isValidStreetNumberKm } from '@/lib/communityValidation';

interface EditCommunityInfoModalProps{
    isOpen: boolean;
    onClose: () => void;
    communityId: string;
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
    onSuccess?: () => void | Promise<void>;
}

const EditCommunityInfoModal: React.FC<EditCommunityInfoModalProps> = ({
    isOpen, onClose, communityId, currentAlias, currentDomicile, onSuccess
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
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        setAlias(currentAlias);
        setComentario('');
        setDomicilio({
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
        setError('');
        setSuccess('');
        setFieldErrors({});
    }, [currentAlias, currentDomicile, isOpen]);

    const handleDomicilioChange = (campo: string, valor: string) => {
        setDomicilio({...domicilio, [campo]: valor});
        setFieldErrors((prev) => ({ ...prev, [campo]: '' }));
    };

    const handleSubmit = async () => {
        setError('');
        setSuccess('');
        setFieldErrors({});

        const nextFieldErrors: Record<string, string> = {};

        if (!alias.trim()) {
            nextFieldErrors.alias = 'Introduce el alias en la comunidad.';
        }

        if (!domicilio.pais.trim()) {
            nextFieldErrors.pais = 'Introduce el país.';
        }

        if (!domicilio.provincia.trim()) {
            nextFieldErrors.provincia = 'Introduce la provincia.';
        }

        if (!domicilio.municipio.trim()) {
            nextFieldErrors.municipio = 'Introduce el municipio.';
        }

        if (!domicilio.tipoVia.trim()) {
            nextFieldErrors.tipoVia = 'Introduce el tipo de vía.';
        }

        if (!domicilio.nombreVia.trim()) {
            nextFieldErrors.nombreVia = 'Introduce el nombre de la vía.';
        }

        if (!domicilio.cp.trim()) {
            nextFieldErrors.cp = 'Introduce el código postal.';
        } else if (!isValidSpanishPostalCode(domicilio.cp)) {
            nextFieldErrors.cp = 'Introduce un código postal válido.';
        }

        if (!domicilio.numero.trim()) {
            nextFieldErrors.numero = 'Introduce el número o Km.';
        } else if (!isValidStreetNumberKm(domicilio.numero)) {
            nextFieldErrors.numero = 'Introduce un número o Km válido.';
        }

        if (Object.keys(nextFieldErrors).length > 0) {
            setFieldErrors(nextFieldErrors);
            return;
        }

        try{
            await requestProfileChange(communityId, {
                alias: alias.trim(),
                comment: comentario || undefined,
                domicile: {
                    country: domicilio.pais.trim(),
                    province: domicilio.provincia.trim(),
                    municipality: domicilio.municipio.trim(),
                    streetType: domicilio.tipoVia.trim(),
                    streetName: domicilio.nombreVia.trim(),
                    postalCode: domicilio.cp.trim(),
                    number: domicilio.numero.trim(),
                    block: domicilio.bloque.trim() || undefined,
                    floor: domicilio.planta.trim() || undefined,
                    door: domicilio.puerta.trim() || undefined
                }
            });
            setSuccess('Solicitud enviada. Pendiente de aprobación.');
            if (onSuccess) {
                await onSuccess();
            }
            setTimeout(() => handleClose(), 1500);
        }catch(err: any){
            const nextFieldErrors = getApiFieldErrors(err, {
                proposedAlias: 'alias',
                country: 'pais',
                province: 'provincia',
                municipality: 'municipio',
                streetType: 'tipoVia',
                streetName: 'nombreVia',
                postalCode: 'cp',
                streetNumberKm: 'numero',
                block: 'bloque',
                floor: 'planta',
                door: 'puerta',
                requestComment: 'comentario'
            });

            if (Object.keys(nextFieldErrors).length > 0) {
                setFieldErrors(nextFieldErrors);
                return;
            }

            setError(getApiErrorMessage(err, 'No se ha podido enviar la solicitud.'));
        }
    };

    const handleClose = () => {
        setAlias(currentAlias);
        setDomicilio({
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
        setError('');
        setSuccess('');
        setComentario('');
        setFieldErrors({});
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
                        <Input value={alias} onChange={(e) => {
                            setAlias(e.target.value);
                            setFieldErrors((prev) => ({ ...prev, alias: '' }));
                        }}></Input>
                        {fieldErrors.alias && <p className='text-sm text-red-500'>{fieldErrors.alias}</p>}
                    </div>

                    <h5 className="font-bold">Domicilio</h5>

                    <div className="grid grid-cols-12 gap-3">
                        <div className="col-span-4 space-y-1">
                            <Label>Pais</Label>
                            <Input value={domicilio.pais} onChange={(e) => handleDomicilioChange('pais', e.target.value)}></Input>
                            {fieldErrors.pais && <p className='text-sm text-red-500'>{fieldErrors.pais}</p>}
                        </div>

                        <div className="col-span-4 space-y-1">
                            <Label>Provincia</Label>
                            <Input value={domicilio.provincia} onChange={(e) => handleDomicilioChange('provincia', e.target.value)}></Input>
                            {fieldErrors.provincia && <p className='text-sm text-red-500'>{fieldErrors.provincia}</p>}
                        </div>

                        <div className="col-span-4 space-y-1">
                            <Label>Municipio</Label>
                            <Input value={domicilio.municipio} onChange={(e) => handleDomicilioChange('municipio', e.target.value)}></Input>
                            {fieldErrors.municipio && <p className='text-sm text-red-500'>{fieldErrors.municipio}</p>}
                        </div>
                    </div>

                    <div className="grid grid-cols-12 gap-3">
                        <div className="col-span-6 space-y-1">
                            <Label>Tipo de via</Label>
                            <Input value={domicilio.tipoVia} onChange={(e) => handleDomicilioChange('tipoVia', e.target.value)}></Input>
                            {fieldErrors.tipoVia && <p className='text-sm text-red-500'>{fieldErrors.tipoVia}</p>}
                        </div>

                        <div className="col-span-6 space-y-1">
                            <Label>Nombre de la via</Label>
                            <Input value={domicilio.nombreVia} onChange={(e) => handleDomicilioChange('nombreVia', e.target.value)}></Input>
                            {fieldErrors.nombreVia && <p className='text-sm text-red-500'>{fieldErrors.nombreVia}</p>}
                        </div>
                    </div>

                    <div className="grid grid-cols-12 gap-3">
                        <div className="col-span-2 space-y-1">
                            <Label>C.P.</Label>
                            <Input value={domicilio.cp} onChange={(e) => handleDomicilioChange('cp', e.target.value)}></Input>
                            {fieldErrors.cp && <p className='text-sm text-red-500'>{fieldErrors.cp}</p>}
                        </div>

                        <div className="col-span-2 space-y-1">
                            <Label>Numero</Label>
                            <Input value={domicilio.numero} onChange={(e) => handleDomicilioChange('numero', e.target.value)}></Input>
                            {fieldErrors.numero && <p className='text-sm text-red-500'>{fieldErrors.numero}</p>}
                        </div>

                        <div className="col-span-2 space-y-1">
                            <Label>Bloque</Label>
                            <Input value={domicilio.bloque} onChange={(e) => handleDomicilioChange('bloque', e.target.value)}></Input>
                            {fieldErrors.bloque && <p className='text-sm text-red-500'>{fieldErrors.bloque}</p>}
                        </div>

                        <div className="col-span-3 space-y-1">
                            <Label>Planta</Label>
                            <Input value={domicilio.planta} onChange={(e) => handleDomicilioChange('planta', e.target.value)}></Input>
                            {fieldErrors.planta && <p className='text-sm text-red-500'>{fieldErrors.planta}</p>}
                        </div>

                        <div className="col-span-3 space-y-1">
                            <Label>Puerta</Label>
                            <Input value={domicilio.puerta} onChange={(e) => handleDomicilioChange('puerta', e.target.value)}></Input>
                            {fieldErrors.puerta && <p className='text-sm text-red-500'>{fieldErrors.puerta}</p>}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Comentario para el administrador (opcional)</Label>
                        <textarea
                            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            value={comentario}
                            onChange={(e) => {
                                setComentario(e.target.value);
                                setFieldErrors((prev) => ({ ...prev, comentario: '' }));
                            }}
                            placeholder="Motivo del cambio..."
                            rows={3}
                        />
                        {fieldErrors.comentario && <p className='text-sm text-red-500'>{fieldErrors.comentario}</p>}
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
