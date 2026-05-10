//Modal de administración para editar nombre y dirección de la comunidad
import React, {useState, useEffect} from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '../input';
import { Button } from '../button';
import { Label } from '../label';
import { updateCommunity } from '@/services/adminService';
import { getApiErrorMessage, getApiFieldErrors } from '@/lib/formErrors';

interface EditCommunityModalProps {
    isOpen: boolean;
    onClose: () => void;
    communityId: string;
    currentData: any;
    onSave: () => void;
}

const EditCommunityModal: React.FC<EditCommunityModalProps> = ({isOpen, onClose, communityId, currentData, onSave}) => {
    const [formData, setFormData] = useState({
        name: '',
        country: '',
        province: '',
        municipality: '',
        streetType: '',
        streetName: '',
        postalCode: '',
        number: ''
    });

    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    //Rellena el formulario con los datos actuales de la comunidad al abrir
    useEffect(() => {
        if(currentData){
            setFormData({
                name: currentData.name || '',
                country: currentData.address?.country || '',
                province: currentData.address?.province || '',
                municipality: currentData.address?.municipality || '',
                streetType: currentData.address?.streetType || '',
                streetName: currentData.address?.streetName || '',
                postalCode: currentData.address?.postalCode || '',
                number: currentData.address?.streetNumberKm || '',
            });
        }

        setFieldErrors({});
        setError('');
        setSuccess('');
    }, [currentData, isOpen]);

    //Actualiza el campo modificado y limpia su error asociado
    const handleChange = (campo: string, valor: string) => {
        setFormData({...formData, [campo]: valor});
        setFieldErrors((prev) => ({ ...prev, [campo]: '' }));
    };

    //Envía los cambios al backend y mapea los errores de la API a los campos del formulario
    const handleSubmit = async () => {
        setError('');
        setSuccess('');
        setFieldErrors({});

        try{
            await updateCommunity(communityId, formData);
            setSuccess('Comunidad actualizada correctamente.');
            onSave();
            setTimeout(() => onClose(), 1500);
        }catch (err: any){
            const nextFieldErrors = getApiFieldErrors(err, {
                name: 'name',
                country: 'country',
                province: 'province',
                municipality: 'municipality',
                streetType: 'streetType',
                streetName: 'streetName',
                postalCode: 'postalCode',
                streetNumberKm: 'number'
            });

            if (Object.keys(nextFieldErrors).length > 0) {
                setFieldErrors(nextFieldErrors);
                return;
            }

            setError(getApiErrorMessage(err, 'No se ha podido actualizar la comunidad.'));
        }
    };

    return(
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className='max-w-2xl'>
                <DialogHeader>
                    <DialogTitle>Editar información de la comunidad</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label>Nombre de la comunidad</Label>
                        <Input value={formData.name} onChange={(e) => handleChange('name', e.target.value)}/>
                        {fieldErrors.name && <p className='text-sm text-red-500'>{fieldErrors.name}</p>}
                    </div>

                    <h5 className='font-bold'>Direccion</h5>

                    <div className="grid grid-cols-12 gap-3">
                        <div className="col-span-4 space-y-1">
                            <Label>Pais</Label>
                            <Input value={formData.country} onChange={(e) => handleChange('country', e.target.value)}/>
                            {fieldErrors.country && <p className='text-sm text-red-500'>{fieldErrors.country}</p>}
                        </div>
                        <div className="col-span-4 space-y-1">
                            <Label>Provincia</Label>
                            <Input value={formData.province} onChange={(e) => handleChange('province', e.target.value)}/>
                            {fieldErrors.province && <p className='text-sm text-red-500'>{fieldErrors.province}</p>}
                        </div>
                        <div className="col-span-4 space-y-1">
                            <Label>Municipio</Label>
                            <Input value={formData.municipality} onChange={(e) => handleChange('municipality', e.target.value)}/>
                            {fieldErrors.municipality && <p className='text-sm text-red-500'>{fieldErrors.municipality}</p>}
                        </div>
                    </div>

                    <div className="grid grid-cols-12 gap-3">
                        <div className="col-span-6 space-y-1">
                            <Label>Tipo de via</Label>
                            <Input value={formData.streetType} onChange={(e) => handleChange('streetType', e.target.value)}/>
                            {fieldErrors.streetType && <p className='text-sm text-red-500'>{fieldErrors.streetType}</p>}
                        </div>
                        <div className="col-span-6 space-y-1">
                            <Label>Nombre de la via</Label>
                            <Input value={formData.streetName} onChange={(e) => handleChange('streetName', e.target.value)}/>
                            {fieldErrors.streetName && <p className='text-sm text-red-500'>{fieldErrors.streetName}</p>}
                        </div>
                    </div>

                    <div className="grid grid-cols-12 gap-3">
                        <div className="col-span-4 space-y-1">
                            <Label>C.P.</Label>
                            <Input value={formData.postalCode} onChange={(e) => handleChange('postalCode', e.target.value)}/>
                            {fieldErrors.postalCode && <p className='text-sm text-red-500'>{fieldErrors.postalCode}</p>}
                        </div>
                        <div className="col-span-4 space-y-1">
                            <Label>Numero</Label>
                            <Input value={formData.number} onChange={(e) => handleChange('number', e.target.value)}/>
                            {fieldErrors.number && <p className='text-sm text-red-500'>{fieldErrors.number}</p>}
                        </div>
                    </div>

                    {error && <p className='text-sm text-red-500'>{error}</p>}
                    {success && <p className='text-sm text-green-500'>{success}</p>}

                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancelar</Button>
                    <Button onClick={handleSubmit}>Guardar</Button>
                </DialogFooter>

            </DialogContent>
        </Dialog>
    );
};

export default EditCommunityModal;