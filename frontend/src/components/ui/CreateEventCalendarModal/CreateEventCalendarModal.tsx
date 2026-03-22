import React, {useState, useEffect} from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../dialog";
import { Button } from "../button";
import { Input } from "../input";
import { Label } from "../label";
import {format} from 'date-fns';
import {es} from 'date-fns/locale';

interface CreateEventCalendarModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (eventData: any) => void;
    selectedDate: Date | undefined;
}

const CreateEventCalendarModal: React.FC<CreateEventCalendarModalProps> = ({isOpen, onClose, onSave, selectedDate}) => {
    const [formData, setFormData] = useState({
        title: '',
        startTime: '10:00',
        endTime: '11:00',
        location: ''
    });

    useEffect(() => {
        if(isOpen){
            setFormData({title: '', startTime: '10:00', endTime: '11:00', location: ''});
        }
    }, [isOpen]);

    const isValid = !!formData.title.trim();

    const handleSave = () => {
        if(!isValid || !selectedDate) return;

        const newEvent = {
            title: formData.title,
            time: `${formData.startTime} - ${formData.endTime}`,
            location: formData.location || '',
            date: selectedDate.toISOString()
        };

        onSave(newEvent);
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Nuevo Evento Personal</DialogTitle>
                    <p className="text-sm text-gray-500 mt-1">
                        Para el dia: <span className="font-bold text-green-600">
                            {selectedDate ? format(selectedDate, "d 'de' MMMM 'de' yyyy", {locale: es}) : ''}
                        </span>
                    </p>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="title" className="font-bold">Título</Label>
                        <Input id="title" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} />
                    </div>

                    <div className="flex gap-4">
                        <div className="flex flex-col gap-2 flex-1">
                            <Label htmlFor="startTime" className="font-bold">Hora inicio</Label>
                            <Input id="startTime" type="time" value={formData.startTime} onChange={(e) => setFormData({...formData, startTime: e.target.value})} />
                        </div>
                        <div className="flex flex-col gap-2 flex-1">
                            <Label htmlFor="endTime" className="font-bold">Hora fin</Label>
                            <Input id="endTime" type="time" value={formData.endTime} onChange={(e) => setFormData({...formData, endTime: e.target.value})} />
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancelar</Button>
                    <Button onClick={handleSave} disabled={!isValid || !selectedDate}>Guardar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default CreateEventCalendarModal;