import React from 'react';
import {Clock, Users, CalendarDays, XCircle } from 'lucide-react';
import { Button } from '../button';
import { formatBusinessDateOnly } from '@/lib/businessDateTime';
import type { Booking } from '@/services/reservationService';

interface BookingCardProps {
    booking: Booking;
    showOwner?: boolean;
    onCancel: (bookingId: string) => void;
}

const BookingCard: React.FC<BookingCardProps> = ({booking, showOwner = false, onCancel}) => {
    const isActive = booking.status === 'ACTIVE';
    const formattedDate = formatBusinessDateOnly(booking.date, "d 'de' MMMM 'de' yyyy");

    return (
        <div className={`bg-white rounded-2xl shadow-sm border overflow-hidden transition-shadow hover:shadow-md ${isActive ? 'border-gray-100' : 'border-gray-200 opacity-75'}`}>
            <div className="flex">
                <div className='w-1.5 shrink-0 rounded-l-2xl' style={{backgroundColor: booking.space.colorHex}} />

                <div className='flex-1 p-5'>
                    <div className='flex items-start justify-between gap-3'>
                        <div className='flex-1 min-w-0'>
                            <div className='flex items-center gap-2.5 mb-2 flex-wrap'>
                                <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wide ${isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                    {isActive ? 'Activa' : 'Cancelada'}
                                </span>
                                <span className='inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border' style={{backgroundColor: booking.space.colorHex + '15', borderColor: booking.space.colorHex + '40', color: booking.space.colorHex}}>
                                    {booking.space.name}
                                </span>
                            </div>

                            <div className='flex flex-col gap-1.5 text-sm text-gray-600 mt-3'>
                                <div className='flex items-center gap-2'>
                                    <CalendarDays className='w-4 h-4 text-gray-400' />
                                    <span className='font-medium'>
                                        {formattedDate}
                                    </span>
                                </div>
                                <div className='flex items-center gap-2'>
                                    <Clock className='w-4 h-4 text-gray-400' />
                                    <span>
                                        {booking.startTime} - {booking.endTime}
                                    </span>
                                    <span className='text-xs text-gray-400'>
                                        ({booking.slotCount} {booking.slotCount === 1 ? 'slot' : 'slots'})
                                    </span>
                                </div>
                                {booking.space.occupancyMode === 'SHARED' && (
                                    <div className='flex items-center gap-2'>
                                        <Users className='w-4 h-4 text-gray-400' />
                                        <span>{booking.requestedSeats} {booking.requestedSeats === 1 ? 'plaza' : 'plazas'}</span>
                                    </div>
                                )}
                            </div>

                            {showOwner && booking.owner && (
                                <p className='text-xs text-gray-400 mt-2'>
                                    Reservado por <span className='font-medium text-gray-500'>{booking.owner.alias}</span>
                                </p>
                            )}

                            {!isActive && (
                                <div className='mt-3 p-3 bg-red-50/50 rounded-lg border border-red-100'>
                                    {booking.cancellationReason && (
                                        <p className='text-xs text-red-600'>
                                            <span className='font-semibold'>Motivo:</span> {booking.cancellationReason}
                                        </p>
                                    )}
                                    {booking.cancelledBy && (
                                        <p className='text-xs text-red-400 mt-1'>
                                            Cancelada por {booking.cancelledBy.alias || 'Administrador'}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>

                        {isActive && booking.canCancel && (
                            <Button variant="outline" size="sm" className='text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 shrink-0' onClick={() => onCancel(booking.id)}>
                                <XCircle className='h-4 w-4 mr-1' /> Cancelar
                            </Button>
                        )}
                    
                
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BookingCard;