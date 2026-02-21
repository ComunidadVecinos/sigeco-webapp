import React, {useEffect, useState} from "react";
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter} from "@/components/ui/dialog";
import {Button} from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
    }) => void;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({isOpen, onClose, initialData, onSave}) => {
    const [formData, setFormData] = useState(initialData);
    const [error, setError] = useState('');

    useEffect(() => {
        if(isOpen){
            setFormData(initialData);
            setError('');
        }
    }, [isOpen, initialData]);

    if(!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value});
        setError('');
    };

    const handleSubmit = () => {

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
            if(soloNumeros.length !== 9){
                setError('El telefono debe tener 9 dígitos');
                return;
            }
        }

        //Validar telefono
        if(formData.email !== initialData.email){
            if(!formData.email.endsWith('@ucm.es')){
                setError('El email debe ser @ucm.es');
                return;
            }
        }

        onSave(formData);
        onClose();
    };

    const handleClose = () => {
        setError('');
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
                    </div>
                    <div className="space-y-2">
                        <Label>Apellidos</Label>
                        <Input name="apellidos" value={formData.apellidos} onChange={handleChange}></Input>
                    </div>
                    <div className="space-y-2">
                        <Label>Teléfono</Label>
                        <Input type="tel" name="telefono" value={formData.telefono} onChange={handleChange}></Input>
                    </div>
                    <div className="space-y-2">
                        <Label>Correo electrónico</Label>
                        <Input type="email" name="email" value={formData.email} onChange={handleChange}></Input>
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