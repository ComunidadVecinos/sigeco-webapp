import React, {useState} from 'react';
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter} from '../dialog';
import {Button} from '../button';
import { Input } from '../input';
import { Label } from '../label';
import {X, Plus} from 'lucide-react';

interface CreateVotingModalProps{
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: {title: string, description: string; endsAtDate: string; endsAtTime: string; options: string[] }) => void;
}

const CreateVotingModal: React.FC<CreateVotingModalProps> = ({isOpen, onClose, onSave}) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [endsAtDate, setEndsAtDate] = useState('');
    const [endsAtTime, setEndsAtTime] = useState('');
    const [options, setOptions] = useState<string[]>(['','']);

    const updateOption = (index: number, value: string) => {
        const next = [...options];
        next[index] = value;
        setOptions(next);
    };

    const addOption = () => {
        if(options.length < 5) setOptions([...options, '']);
    };

    const removeOption = (index: number) => {
        if(options.length > 2) setOptions(options.filter((_, i) => i !== index));
    };

    const validOptions = options.filter(o => o.trim());
    const isValid = title.trim() && endsAtDate && endsAtTime && validOptions.length >= 2;

    const handleSave = () => {
        if(!isValid) return;
        onSave({title, description, endsAtDate, endsAtTime, options: validOptions});
        handleClose();
    };

    const handleClose = () => {
        setTitle('');
        setDescription('');
        setEndsAtDate('');
        setEndsAtTime('');
        setOptions(['', '']);
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
            <DialogContent className='sm:max-w-[550px] max-h-[90vh] overflow-y-auto'>
                <DialogHeader>
                    <DialogTitle>Crear nueva votación</DialogTitle>
                </DialogHeader>

                <div className='grid gap-4 py-4'>
                    <div className='flex flex-col gap-2'>
                        <Label className='font-bold'>Título <span className='text-red-500'>
                            *</span>
                        </Label>
                        <Input value={title} onChange={(e) => setTitle(e.target.value)}></Input>
                    </div>

                    <div className='flex flex-col gap-2'>
                        <Label className='font-bold'>Descripción <span className='text-xs font-normal text-gray-400'>(opcional)</span>
                        </Label>
                        <textarea className='w-full min-h-[80px] border border-gray-200 rounded-md p-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none' value={description} onChange={(e) => setDescription(e.target.value)}/>
                    </div>

                    <div className='flex flex-col gap-2'>
                        <Label className='font-bold'>Opciones de voto <span className='text-red-500'>*</span></Label>
                        <p className='text-xs text-gray-400 -mt-1'>Mínimo 2, máximo 5 opciones</p>
                        {options.map((option, index) => (
                            <div className='flex gap-2' key={index}>
                                <Input value={option} onChange={(e) => updateOption(index, e.target.value)} placeholder={`Opción ${index + 1}`} />
                                {options.length > 2 && (
                                    <button className='px-2 text-red-500 bg-transparent border-none cursor-pointer hover:text-red-700 transition-colors' onClick={() => removeOption(index)}>
                                        <X className='h-4 w-4' />
                                    </button>
                                )}
                            </div>
                        ))}
                        {options.length < 5 && (
                            <button
                                className='w-full py-2 px-3 border border-dashed border-gray-300 text-gray-400 rounded-lg text-sm bg-transparent cursor-pointer hover:border-blue-400 hover:text-blue-500 transition-colors'
                                onClick={addOption}>
                                    <Plus className='h-4 w-4 inline mr-1' /> Añadir opción
                            </button>
                        )}
                    </div>

                    <div className='flex flex-col gap-2 bg-amber-50/50 border border-amber-100 rounded-lg p-4'>
                        <Label className='font-bold text-sm'>Fecha y hora de cierre <span className='text-red-500'>*</span></Label>
                        <p className='text-xs text-gray-500 -mt-1'>Debe ser al menos 1 hora posterior al momento de creación</p>
                        <div className='flex gap-3'>
                            <Input type='date' className='flex-1' value={endsAtDate} onChange={(e) => setEndsAtDate(e.target.value)} />
                            <Input type='time' className='w-[140px]' value={endsAtTime} onChange={(e) => setEndsAtTime(e.target.value)} />
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={handleClose}>Cancelar</Button>
                    <Button onClick={handleSave} disabled={!isValid}>Crear votación</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default CreateVotingModal;