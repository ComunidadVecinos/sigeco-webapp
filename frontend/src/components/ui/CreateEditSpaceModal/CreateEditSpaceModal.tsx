//Modal para crear o editar un espacio reservable: datos básicos, horarios, capacidad, días y reglas de reserva
import React, {useState} from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../dialog';
import { Button } from '../button';
import { Input } from '../input';
import { Label } from '../label';

//Etiquetas de los días de la semana para el selector de días permitidos
const DAY_LABELS: {key: string; label: string} [] = [
    {key: 'monday', label: 'Lun'},
    {key: 'tuesday', label: 'Mar'},
    {key: 'wednesday', label: 'Mie'},
    {key: 'thursday', label: 'Jue'},
    {key: 'friday', label: 'Vie'},
    {key: 'saturday', label: 'Sab'},
    {key: 'sunday', label: 'Dom'},
];

//Duraciones de slot disponibles en mins
const SLOT_OPTIONS = [15, 30, 45, 60, 90, 120];

interface CreateEditSpaceModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: any) => void;
    spaceToEdit?: any;
}

const CreateEditSpaceModal: React.FC<CreateEditSpaceModalProps> = ({isOpen, onClose, onSave, spaceToEdit}) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [color, setColor] = useState('#1F6FEB');
    const [totalCapacity, setTotalCapacity] = useState(10);
    const [occupancyMode, setOccupancyMode] = useState<'SHARED' | 'EXCLUSIVE'>('EXCLUSIVE');
    const [maxSeatsPerBooking, setMaxSeatsPerBooking] = useState<number | ''>('');
    const [openingTime, setOpeningTime] = useState('09:00');
    const [closingTime, setClosingTime] = useState('21:00');
    const [slotMinutes, setSlotMinutes] = useState(60);
    const [allowedDays, setAllowedDays] = useState({
        monday: true, tuesday: true, wednesday: true, thursday: true, friday: true, saturday:false, sunday: false
    });
    const [maxConsecutiveSlots, setMaxConsecutiveSlots] = useState(2);
    const [minAdvanceMinutes, setMinAdvanceMinutes] = useState(60);
    const [maxAdvanceDays, setMaxAdvanceDays] = useState(30);
    const [cancellationNoticeMinutes, setCancellationNoticeMinutes] = useState(120);

    //Si se esta editando rellena todos los campos con los datos existentes
    React.useEffect(() => {
        if(isOpen){
            if(spaceToEdit){
                setName(spaceToEdit.name);
                setDescription(spaceToEdit.description || '');
                setColor(spaceToEdit.colorHex);
                setTotalCapacity(spaceToEdit.totalCapacity);
                setOccupancyMode(spaceToEdit.occupancyMode);
                setMaxSeatsPerBooking(spaceToEdit.maxSeatsPerBooking || '');
                setOpeningTime(spaceToEdit.openingTime);
                setClosingTime(spaceToEdit.closingTime);
                setSlotMinutes(spaceToEdit.slotMinutes);
                setAllowedDays(spaceToEdit.allowedDays);
                setMaxConsecutiveSlots(spaceToEdit.maxConsecutiveSlots);
                setMinAdvanceMinutes(spaceToEdit.minAdvanceMinutes);
                setMaxAdvanceDays(spaceToEdit.maxAdvanceDays);
                setCancellationNoticeMinutes(spaceToEdit.cancellationNoticeMinutes);
            }
        }
    }, [isOpen, spaceToEdit]);

    const toggleDay = (key: string) => {
        setAllowedDays(prev => ({...prev, [key]: !prev[key as keyof typeof prev]}));
    };

    //Valida que al menos haya un dia seleccionado, horario divisble por duración de slot y reglas coherentes
    const atLeastOneDay = Object.values(allowedDays).some(Boolean);

    const openMin = parseInt(openingTime.split(':')[0]) * 60 + parseInt(openingTime.split(':')[1]);
    const closeMin = parseInt(closingTime.split(':')[0]) * 60 + parseInt(closingTime.split(':')[1]);
    const totalMinutes = closeMin - openMin;
    const isDivisible = totalMinutes > 0 && totalMinutes % slotMinutes === 0;
    const totalSlots = isDivisible ? totalMinutes / slotMinutes : 0;

    const isValid = name.trim() && openingTime < closingTime && atLeastOneDay && isDivisible && maxConsecutiveSlots >= 1 && maxConsecutiveSlots <= totalSlots && (occupancyMode === 'EXCLUSIVE' || (typeof maxSeatsPerBooking === 'number' && maxSeatsPerBooking >= 1 && maxSeatsPerBooking <= totalCapacity));

    //Construye el espacio con todos los datos que se necesitan y lo envía al padre
    const handleSave = () => {
        if(!isValid) return;
        onSave({
            name: name.trim(),
            description: description.trim() || undefined,
            colorHex: color,
            isActive: true,
            totalCapacity,
            occupancyMode,
            maxSeatsPerBooking: occupancyMode === 'SHARED' && typeof maxSeatsPerBooking === 'number' ? maxSeatsPerBooking : undefined,
            openingTime,
            closingTime,
            slotMinutes,
            allowedDays,
            maxConsecutiveSlots,
            minAdvanceMinutes,
            maxAdvanceDays,
            cancellationNoticeMinutes
        });
        handleClose();
    };

    //Resetea todos los campos a sus valores iniciales cuando se cierra
    const handleClose = () => {
        setName('');
        setDescription('');
        setColor('#1F6FEB');
        setTotalCapacity(10);
        setOccupancyMode('EXCLUSIVE');
        setMaxSeatsPerBooking('');
        setOpeningTime('09:00');
        setClosingTime('21:00');
        setSlotMinutes(60);
        setAllowedDays({monday: true, tuesday: true, wednesday: true, thursday: true, friday: true, saturday:false, sunday: false});
        setMaxConsecutiveSlots(2);
        setMinAdvanceMinutes(60);
        setMaxAdvanceDays(30);
        setCancellationNoticeMinutes(120);
        onClose();
    };
    
    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
            <DialogContent className='sm:max-w-[600px] max-h-[90vh] overflow-y-auto'>
                <DialogHeader>
                    <DialogTitle>{spaceToEdit ? 'Editar espacio' : 'Crear nuevo espacio'}</DialogTitle>
                </DialogHeader>

                <div className='grid gap-4 py-4'>
                    <div className='flex gap-3'>
                        <div className='flex flex-col gap-2 flex-1'>
                            <Label className='font-bold'>Nombre <span className='text-red-500'>*</span></Label>
                            <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={160} />
                        </div>
                        <div className='flex flex-col gap-2 w-[80px]'>
                            <Label className='font-bold'>Color</Label>
                            <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className='w-full h-[38px] rounded-md border border-gray-200 cursor-pointer' />
                        </div>
                    </div>

                    <div className='flex flex-col gap-2'>
                        <Label className='font-bold'>Descripción <span className='text-xs font-normal text-gray-400'>(opcional)</span></Label>
                        <textarea className='w-full min-h-[60px] border border-gray-200 rounded-md p-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none' value={description} onChange={(e) => setDescription(e.target.value)} />
                    </div>

                    <div className='flex gap-3'>
                        <div className='flex flex-col gap-2 flex-1'>
                            <Label className='font-bold'>Capacidad total <span className='text-red-500'>*</span></Label>
                            <Input type='number' min={1} value={totalCapacity} onChange={(e) => setTotalCapacity(Number(e.target.value))} />
                        </div>
                        <div className='flex flex-col gap-2 flex-1'>
                            <Label className='font-bold'>Modo de ocupación <span className='text-red-500'>*</span></Label>
                            <select className='h-[38px] border border-gray-200 rounded-md px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-white' value={occupancyMode} onChange={(e) => setOccupancyMode(e.target.value as any)}>
                                <option value="EXCLUSIVE">Exclusivo</option>
                                <option value="SHARED">Compartido</option>
                            </select>
                        </div>
                    </div>

                    {occupancyMode === 'SHARED' && (
                        <div className='flex flex-col gap-2 bg-blue-50/50 border border-blue-100 rounded-lg p-4'>
                            <Label className='font-bold text-sm'>Máximas plazas por reserva <span className='text-red-500'>*</span></Label>
                            <p className='text-xs text-gray-500 -mt-1'>No puede superar la capacidad total ({totalCapacity})</p>
                            <Input type='number' min={1} max={totalCapacity} value={maxSeatsPerBooking} onChange={(e) => setMaxSeatsPerBooking(Number(e.target.value))} />
                        </div>
                    )}

                    <div className='flex gap-3'>
                        <div className='flex flex-col gap-2 flex-1'>
                            <Label className='font-bold'>Hora apertura <span className='text-red-500'>*</span></Label>
                            <Input type='time' value={openingTime} onChange={(e) => setOpeningTime(e.target.value)} />
                        </div>
                        <div className='flex flex-col gap-2 flex-1'>
                            <Label className='font-bold'>Hora cierre <span className='text-red-500'>*</span></Label>
                            <Input type='time' value={closingTime} onChange={(e) => setClosingTime(e.target.value)} />
                        </div>
                        <div className='flex flex-col gap-2 w-[130px]'>
                            <Label className='font-bold'>Duración slot</Label>
                            <select className='h-[38px] border border-gray-200 rounded-md px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-white' value={slotMinutes} onChange={(e) => setSlotMinutes(Number(e.target.value))}>
                                {SLOT_OPTIONS.map(m => <option key={m} value={m}>{m} min</option>)}
                            </select>
                        </div>
                    </div>

                    {!isDivisible && openingTime < closingTime && (
                        <p className='text-xs text-red-500'>El horario ({totalMinutes} min) no es divisible por la duración del slot ({slotMinutes} min)</p>
                    )}

                    <div className='flex flex-col gap-2'>
                        <Label className='font-bold'>Días permitidos <span className='text-red-500'>*</span></Label>
                        <div className='flex gap-2'>
                            {DAY_LABELS.map(({key, label}) => (
                                <button key={key} type='button' onClick={() => toggleDay(key)} className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${allowedDays[key as keyof typeof allowedDays] ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-500 border-gray-200 hover:border-blue-300'}`}>{label}</button>
                            ))}
                        </div>
                        {!atLeastOneDay && <p className='text-xs text-red-500'>Selecciona al menos un día</p>}
                    </div>

                    <div className='bg-amber-50/50 border border-amber-100 rounded-lg p-4 space-y-3'>
                        <p className='text-sm font-bold text-gray-700'>Reglas de reserva</p>
                        <div className='grid grid-cols-2 gap-3'>
                            <div className='flex flex-col gap-1'>
                                <Label className='text-xs'>Maximo de slots consecutivos</Label>
                                <Input type='number' min={1} max={totalSlots || 99} value={maxConsecutiveSlots} onChange={(e) => setMaxConsecutiveSlots(Number(e.target.value))} />
                            </div>
                            <div className='flex flex-col gap-1'>
                                <Label className='text-xs'>Antelacion minima</Label>
                                <Input type='number' min={0} value={minAdvanceMinutes} onChange={(e) => setMinAdvanceMinutes(Number(e.target.value))}/>
                            </div>
                            <div className='flex flex-col gap-1'>
                                <Label className='text-xs'>Maximos dias de antelación</Label>
                                <Input type='number' min={1} value={maxAdvanceDays} onChange={(e) => setMaxAdvanceDays(Number(e.target.value))}/>
                            </div>
                            <div className='flex flex-col gap-1'>
                                <Label className='text-xs'>Margen cancelacion minimo</Label>
                                <Input type='number' min={0} value={cancellationNoticeMinutes} onChange={(e) => setCancellationNoticeMinutes(Number(e.target.value))} />
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={handleClose}>Cancelar</Button>
                    <Button onClick={handleSave} disabled={!isValid}>{spaceToEdit ? 'Guardar cambios' : 'Crear espacio'}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default CreateEditSpaceModal;