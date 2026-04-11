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
    editingEvent?: {
        id: string;
        title: string;
        date: string;
        startTime: string;
        endTime: string;
    } | null;
}

const CreateEventCalendarModal: React.FC<CreateEventCalendarModalProps> = ({isOpen, onClose, onSave, selectedDate, editingEvent}) => {
    const [formData, setFormData] = useState({
        title: '',
        startTime: '10:00',
        endTime: '11:00',
    });

    useEffect(() => {
        if(isOpen){
            if(editingEvent){
                setFormData({
                    title: editingEvent.title,
                    startTime: editingEvent.startTime,
                    endTime: editingEvent.endTime
                });
            } else {
                setFormData({title: '', startTime: '10:00', endTime: '11:00'});
            }
        }
    }, [isOpen, editingEvent]);

    const effectiveDate = editingEvent?.date ? new Date(`${editingEvent.date}T00:00:00`) : selectedDate;
    const isValid = !!formData.title.trim() && formData.startTime < formData.endTime;

    const handleSave = () => {
        if(!isValid || !effectiveDate) return;

        const eventEvent = {
            title: formData.title,
            date: format(effectiveDate, 'yyyy-MM-dd'),
            startTime: formData.startTime,
            endTime: formData.endTime
        };

        onSave(eventEvent);
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{editingEvent ? 'Editar Evento Personal' : 'Nuevo Evento Personal'}</DialogTitle>
                    <p className="text-sm text-gray-500 mt-1">
                        Para el dia: <span className="font-bold text-green-600">
                            {effectiveDate ? format(effectiveDate, "d 'de' MMMM 'de' yyyy", {locale: es}) : ''}
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
                    <Button onClick={handleSave} disabled={!isValid || !effectiveDate}>{editingEvent ? 'Guardar Cambios' : 'Guardar'}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default CreateEventCalendarModal;
