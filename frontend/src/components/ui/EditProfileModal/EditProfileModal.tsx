//Modal para editar la información personal del usuario (nombre, apellidos, teléfono, email)
import React, {useEffect, useState} from "react";
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter} from "@/components/ui/dialog";
import {Button} from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateProfile } from "@/services/userServices";
import { getApiErrorMessage, getApiFieldErrors, hasFieldErrors } from "@/lib/formErrors";

interface EditProfileModalProps{
    isOpen: boolean;
    onClose: () => void;
    initialData: {
        nombre: string;
        apellidos: string;
        telefono: string;
        email: string;
    };

    onSave: (data: {
        nombre: string;
        apellidos: string;
        telefono: string;
        email: string;
    }) => Promise<void>;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({isOpen, onClose, initialData, onSave}) => {
    const [formData, setFormData] = useState(initialData);
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    //Reinicia el formulario con los datos actuales cada vez que se abre el modal
    useEffect(() => {
        if(isOpen){
            setFormData(initialData);
            setError('');
            setFieldErrors({});
        }
    }, [isOpen, initialData]);

    if(!isOpen) return null;

    //Actualiza el campo modificado y limpia los errores asociados
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value});
        setError('');
        setFieldErrors((prev) => ({ ...prev, [e.target.name]: '' }));
    };

    //Valida los campos localmente, envia los cambios al backend y mapea errores de la API a los campos del formulario
    const handleSubmit = async () => {

        //Validar nombre
        if(formData.nombre !== initialData.nombre){
            if(!formData.nombre.trim()){
                setError('El nombre no puede estar vacío');
                return;
            }
        }

        //Validar apellidos
        if(formData.apellidos !== initialData.apellidos){
            if(!formData.apellidos.trim()){
                setError('Los apellidos no pueden estar vacíos');
                return;
            }
        }

        //Validar telefono
        if(formData.telefono !== initialData.telefono){
            const soloNumeros = formData.telefono.replace(/\D/g, '');
            if(formData.telefono.trim() && soloNumeros.length !== 9){
                setError('El telefono debe tener 9 dígitos');
                return;
            }
        }

        //Validar email
        if(formData.email !== initialData.email){
            if(!formData.email.endsWith('@ucm.es')){
                setError('El email debe ser @ucm.es');
                return;
            }
        }

        try{
            await updateProfile({
                firstName: formData.nombre,
                lastName: formData.apellidos,
                phone: formData.telefono.trim() || undefined,
                email: formData.email,
            });
            await onSave(formData);
            onClose();
        } //Mapea los errores de la API a los nombres de campo del formulario
        catch(err: any){
            const mappedFieldErrors = getApiFieldErrors(err, {
                firstName: 'nombre',
                lastName: 'apellidos',
                email: 'email',
                phone: 'telefono'
            });

            if (hasFieldErrors(mappedFieldErrors)) {
                setFieldErrors(mappedFieldErrors);
                return;
            }

            const msg = getApiErrorMessage(err, 'No se ha podido guardar la información personal.');
            setError(msg);
        }
    };

    //Limpia el formulario al cerrar
    const handleClose = () => {
        setError('');
        setFieldErrors({});
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => {if(!open) onClose(); }}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Editar Información Personal</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">{error}</div>}
                    <div className="space-y-2">
                        <Label>Nombre</Label>
                        <Input name="nombre" value={formData.nombre} onChange={handleChange}></Input>
                        {fieldErrors.nombre && <div className='text-sm text-red-500'>{fieldErrors.nombre}</div>}
                    </div>
                    <div className="space-y-2">
                        <Label>Apellidos</Label>
                        <Input name="apellidos" value={formData.apellidos} onChange={handleChange}></Input>
                        {fieldErrors.apellidos && <div className='text-sm text-red-500'>{fieldErrors.apellidos}</div>}
                    </div>
                    <div className="space-y-2">
                        <Label>Teléfono</Label>
                        <Input type="tel" name="telefono" value={formData.telefono} onChange={handleChange}></Input>
                        {fieldErrors.telefono && <div className='text-sm text-red-500'>{fieldErrors.telefono}</div>}
                    </div>
                    <div className="space-y-2">
                        <Label>Correo electrónico</Label>
                        <Input type="email" name="email" value={formData.email} onChange={handleChange}></Input>
                        {fieldErrors.email && <div className='text-sm text-red-500'>{fieldErrors.email}</div>}
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="secondary" onClick={onClose}>Cerrar</Button>
                    <Button onClick={handleSubmit}>Guardar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default EditProfileModal;