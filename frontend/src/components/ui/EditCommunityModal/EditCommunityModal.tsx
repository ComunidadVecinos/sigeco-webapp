import React, {useState, useEffect} from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '../input';
import { Button } from '../button';
import { Label } from '../label';
import { updateCommunity } from '@/services/adminService';

interface EditCommunityModalProps {
    isOpen: boolean;
    onClose: () => void;
    communityId: number;
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

    useEffect(() => {
        if(currentData){
            setFormData({
                name: currentData.name || '',
                country: currentData.country || '',
                province: currentData.province || '',
                municipality: currentData.municipality || '',
                streetType: currentData.streetType || '',
                streetName: currentData.streetName || '',
                postalCode: currentData.postalCode || '',
                number: currentData.number || '',
            });
        }
    }, [currentData]);

    const handleChange = (campo: string, valor: string) => {
        setFormData({...formData, [campo]: valor});
    };

    const handleSubmit = async () => {
        setError('');
        setSuccess('');
        try{
            await updateCommunity(communityId, formData);
            setSuccess('Comunidad actualizada correctamente.');
            onSave();
            setTimeout(() => onClose(), 1500); 
        }catch (err: any){
            setError(err.response?.data?.error?.message || 'Error al actualizar');
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
                    </div>

                    <h5 className='font-bold'>Dirección</h5>

                    <div className="grid grid-cols-12 gap-3">
                        <div className="col-span-4 space-y-1">
                            <Label>País</Label>
                            <Input value={formData.country} onChange={(e) => handleChange('country', e.target.value)}/>
                        </div>
                        <div className="col-span-4 space-y-1">
                            <Label>Provincia</Label>
                            <Input value={formData.province} onChange={(e) => handleChange('province', e.target.value)}/>
                        </div>
                        <div className="col-span-4 space-y-1">
                            <Label>Municipio</Label>
                            <Input value={formData.municipality} onChange={(e) => handleChange('municipality', e.target.value)}/>
                        </div>
                    </div>

                    <div className="grid grid-cols-12 gap-3">
                        <div className="col-span-6 space-y-1">
                            <Label>Tipo de vía</Label>
                            <Input value={formData.streetType} onChange={(e) => handleChange('streetType', e.target.value)}/>
                        </div>
                        <div className="col-span-6 space-y-1">
                            <Label>Nombre de la vía</Label>
                            <Input value={formData.streetName} onChange={(e) => handleChange('streetName', e.target.value)}/>
                        </div>
                    </div>

                    <div className="grid grid-cols-12 gap-3">
                        <div className="col-span-4 space-y-1">
                            <Label>C.P.</Label>
                            <Input value={formData.postalCode} onChange={(e) => handleChange('postalCode', e.target.value)}/>
                        </div>
                        <div className="col-span-4 space-y-1">
                            <Label>Número</Label>
                            <Input value={formData.number} onChange={(e) => handleChange('number', e.target.value)}/>
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