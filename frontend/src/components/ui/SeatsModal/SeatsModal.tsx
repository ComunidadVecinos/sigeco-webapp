//Modal para seleccionar el número de plazas a reservar en un espacio compartido
import React, {useState} from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../dialog';
import { Button } from '../button';
import { Input } from '../input';
import { Label } from '../label';
import { Users } from 'lucide-react';

interface SeatsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (seats: number) => void;
    maxSeats:  number;
    totalCapacity: number;
}

const SeatsModal: React.FC<SeatsModalProps> = ({isOpen, onClose, onConfirm, maxSeats, totalCapacity}) => {
    const [seats, setSeats] = useState(1);

    //Cofirma la reserva con el número de plazas seleccionado y resetea el campo
    const handleConfirm = () => {
        if(seats >= 1 && seats <= maxSeats) {
            onConfirm(seats);
            setSeats(1);
        }
    };

    //Resetea el modal a los valores iniciales una vez se cierra
    const handleClose = () => {
        setSeats(1);
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
            <DialogContent className='sm:max-w-[400px]'>
                <DialogHeader>
                    <DialogTitle>Número de plazas</DialogTitle>
                </DialogHeader>

                <div className='py-4'>
                    <div className='flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl mb-4'>
                        <Users className='h-5 w-5 text-blue-600 shrink-0' />
                        <p className='text-sm text-blue-800'>Este espacio es compartido. Indica cuántas plazas necesitas reservar.</p>
                    </div>

                    <div className='flex flex-col gap-2'>
                        <Label className='font-bold text-sm'>
                            Plazas <span className='text-xs font-normal text-gray-400'>(máx. {maxSeats} de {totalCapacity} totales)</span>
                        </Label>
                        <Input
                            type='number'
                            min={1}
                            max={maxSeats}
                            value={seats}
                            onChange={(e) => setSeats(Math.max(1, Math.min(maxSeats, Number(e.target.value))))}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={handleClose}>Cancelar</Button>
                    <Button onClick={handleConfirm} disabled={seats < 1 || seats > maxSeats}>Confirmar reserva</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default SeatsModal;