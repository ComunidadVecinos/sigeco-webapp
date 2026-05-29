//Página de reservas de espacios comunes: calendario con slots horario, reserva con plazas (compartido/exclusivo), listado personal y global(admin)
import React, { useEffect, useState } from 'react';
import Header from '@/components/common/Header/Header';
import Sidebar from '@/components/ui/Sidebar/Sidebar';
import BookingCard from '@/components/ui/BookingCard/BookingCard';
import SeatsModal from '@/components/ui/SeatsModal/SeatsModal';
import CancelBookingModal from '@/components/ui/CancelBookingModal/CancelBookingModal';
import { Menu, CalendarDays, List, Users, Settings } from 'lucide-react';
import { useAuth } from '@/context/authContext';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { getSpaces, getAvailability, createBooking, getMyBookings, cancelBooking, getCommunityBookings, type Space, type Slot, type BookingRules, type Booking } from '@/services/reservationService';
import FeedbackModal from '@/components/ui/FeedbackModal/FeedbackModal';
import { getApiErrorMessage } from '@/lib/formErrors';

//Pestañas de navegación: calendario, mis reservas y todas las reservas (solo admin)
type Tab = 'calendar' | 'myBookings' | 'allBookings';

const ReservationsPage: React.FC = () => {
    const navigate = useNavigate();
    const { user, loading: authLoading } = useAuth();
    const communityId = user?.activeCommunityId;
    const activeComunity: any = user?.communities?.find((c: any) => c.communityId === communityId);
    const isAdmin = activeComunity?.role === 'PRESIDENT' || activeComunity?.role === 'VICE_PRESIDENT';
    //Estado general, sidebar y pestaña activa
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<Tab>('calendar');

    // Calendario 
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
    const [spaces, setSpaces] = useState<Space[]>([]);
    const [selectedSpaceId, setSelectedSpaceId] = useState<string | null>(null);
    const [slots, setSlots] = useState<Slot[]>([]);
    const [bookingRules, setBookingRules] = useState<BookingRules | null>(null);
    const [selectedSlots, setSelectedSlots] = useState<number[]>([]);
    const [loadingAvailability, setLoadingAvailability] = useState(false);
    const [availabilityError, setAvailabilityError] = useState('');
    //Modales
    const [isSeatsModalOpen, setIsSeatsModalOpen] = useState(false);
    const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
    const [cancellingBookingId, setCancellingBookingId] = useState<string | null>(null);
    //Reserva
    const [myBookings, setBookings] = useState<Booking[]>([]);
    const [myBookingsScope, setMyBookingsScope] = useState('upcoming');
    const [myBookingsPage, setMyBookingsPage] = useState(0);
    const [myBookingHasMore, setMyBookingHasMore] = useState(true);
    const [loadingMyBookings, setLoadingMyBookings] = useState(false);
    //Todas las reservas
    const [allBookings, setAllBookings] = useState<Booking[]>([]);
    const [allBookingsPage, setAllBookingPage] = useState(0);
    const [allBookingsHasMore, setAllBookingsHasMore] = useState(true);
    const [loadingAllBookings, setLoadingAllBookings] = useState(false);
    const [allBookingsStatus, setAllBookingsStatus] = useState('active');
    //Feedback global
    const [feedback, setFeedback] = useState<{isOpen: boolean, type: 'success' | 'error', message: string}>({isOpen: false, type: 'success', message: ''});
    const closeFeedback = () => setFeedback(prev => ({...prev, isOpen: false}));

    // ---- Redirect si no hay comunidad ---- //
    useEffect(() => {
        if (!authLoading && user && !communityId) {
            navigate('/auth/me', { replace: true });
        }
    }, [authLoading, communityId, navigate, user]);

    // ---- Cargar los espacios ---- //
    useEffect(() => {
        if (!communityId) return;

        const loadSpaces = async () => {
            try {
                const res = await getSpaces(communityId, { status: 'active', pageSize: 100 });
                const items = res.data.items || [];
                setSpaces(items);
                if (items.length > 0 && !selectedSpaceId) {
                    setSelectedSpaceId(items[0].id);
                }
            } catch (err) {
                console.error('Error cargando espacios', err);
            }
        };

        loadSpaces();
    }, [communityId]);

    // ---- Cargar disponibilidad ---- //
    useEffect(() => {
        if (!communityId || !selectedSpaceId || !selectedDate) return;

        setLoadingAvailability(true);
        setAvailabilityError('');
        setSelectedSlots([]);
        const loadAvailability = async () => {
            try {
                const dateStr = format(selectedDate, 'yyyy-MM-dd');
                const res = await getAvailability(communityId, selectedSpaceId, dateStr);
                setSlots(res.data.slots || []);
                setBookingRules(res.data.bookingRules || null);
            } catch (err) {
                console.error('Error cargando disponibilidad', err);
                setSlots([]);
                setAvailabilityError((err as any).response?.data?.error?.message || 'No se pudo cargar la disponibilidad');
            } finally {
                setLoadingAvailability(false);
            }
        };

        loadAvailability();
    }, [communityId, selectedSpaceId, selectedDate]);

    // ---- Selección de slots ---- //
    const handleSlotsClick = (slotIndex: number) => {
        const slot = slots.find(s => s.slotIndex === slotIndex);
        if (!slot || !slot.available || !bookingRules) return;

        setSelectedSlots(prev => {
            const idx = prev.indexOf(slotIndex);
            if (idx !== -1) {
                return prev.slice(0, idx);
            }

            if (prev.length === 0) return [slotIndex];

            if (prev.length >= bookingRules.maxConsecutiveSlots) return prev;

            if (slotIndex === prev[prev.length - 1] + 1) {
                return [...prev, slotIndex];
            }

            return [slotIndex];
        });
    };

    // ---- Confirmar reserva ---- //
    const handleConfirmBooking = () => {
        if (selectedSlots.length === 0 || !selectedSpaceId) return;
        const space = spaces.find(s => s.id === selectedSpaceId);
        if (space?.occupancyMode === 'SHARED') {
            setIsSeatsModalOpen(true);
        } else {
            executeBooking();
        }
    };

    //Ejecuta la reserva enviando espacio, fecha, hora y slots; si es compartido incluye las plazas solicitadas
    const executeBooking = async (requestedSeats?: number) => {
        if (!communityId || !selectedSpaceId || !selectedDate || selectedSlots.length === 0) return;

        const firstSlot = slots.find(s => s.slotIndex === selectedSlots[0]);
        if (!firstSlot) return;

        const data: any = {
            spaceId: selectedSpaceId,
            date: format(selectedDate, 'yyyy-MM-dd'),
            startTime: firstSlot.startTime,
            slotCount: selectedSlots.length
        };

        if (requestedSeats) data.requestedSeats = requestedSeats;

        try {
            await createBooking(communityId, data);

            setSelectedSlots([]);
            setIsSeatsModalOpen(false);

            const dateStr = format(selectedDate, 'yyyy-MM-dd');
            const res = await getAvailability(communityId, selectedSpaceId, dateStr);
            setSlots(res.data.slots || []);
            setBookingRules(res.data.bookingRules || null);
            setFeedback({isOpen: true, type: 'success', message: '¡Reserva creada con éxito!'});
        } catch (err) {
            setFeedback({isOpen: true, type: 'error', message: getApiErrorMessage(err, 'Error al crear la reserva')});
        }
    };

    // ---- Mis Reservas ---- //
    const loadMyBookings = async (pageNum: number, append = false) => {
        if (!communityId) return;
        setLoadingMyBookings(true);

        try {
            const res = await getMyBookings(communityId, { page: pageNum + 1, pageSize: 10, scope: myBookingsScope });
            const items = res.data.items || [];
            setBookings(prev => append ? [...prev, ...items] : items);
            const pag = res.data.pagination;
            setMyBookingHasMore(pag ? pag.page < pag.totalPages : false);
        } catch (err) {
            console.error('Error cargando mis reservas', err);
        } finally {
            setLoadingMyBookings(false);
        }
    };

    //Recarga mis reservas cuando cambia la pestaña, comunidad o filtro de alcance
    useEffect(() => {
        if (activeTab === 'myBookings' && communityId) {
            setMyBookingsPage(0);
            loadMyBookings(0);
        }
    }, [activeTab, communityId, myBookingsScope]);

    // ---- Todas las reservas ---- //
    const loadAllBookings = async (pageNum: number, append = false) => {
        if (!communityId) return;
        setLoadingAllBookings(true);

        try {
            const res = await getCommunityBookings(communityId, { page: pageNum + 1, pageSize: 10, status: allBookingsStatus });
            const items = res.data.items || [];
            setAllBookings(prev => append ? [...prev, ...items] : items);
            const pag = res.data.pagination;
            setAllBookingsHasMore(pag ? pag.page < pag.totalPages : false);
        } catch (err) {
            console.error('Error cargando reservas comunidad', err);
        } finally {
            setLoadingAllBookings(false);
        }
    };

    //Recarga todas las reservas cuando cambia la pestaña, comunidad o filtro de alcance
    useEffect(() => {
        if (activeTab === 'allBookings' && communityId && isAdmin) {
            setAllBookingPage(0);
            loadAllBookings(0);
        }
    }, [activeTab, communityId, allBookingsStatus]);

    // ---- Cancelar reserva ---- //
    const handleOpenCancel = (bookingId: string) => {
        setCancellingBookingId(bookingId);
        setIsCancelModalOpen(true);
    };

    //Cancela la reserva con motivo opcional y reacrga la pestaña activa
    const handleConfirmCancel = async (reason?: string) => {
        if (!communityId || !cancellingBookingId) return;

        try {
            await cancelBooking(communityId, cancellingBookingId, reason);
            setIsCancelModalOpen(false);
            setCancellingBookingId(null);
            setFeedback({isOpen: true, type: 'success', message: '¡Reserva cancelada con éxito!'});
            if (activeTab === 'myBookings') {
                setMyBookingsPage(0);
                loadMyBookings(0);
            }
            if (activeTab === 'allBookings') {
                setAllBookingPage(0);
                loadAllBookings(0);
            }
        } catch (err) {
            setFeedback({isOpen: true, type: 'error', message: getApiErrorMessage(err, 'Error al cancelar la reserva')});
        };
    };

    // ---- Calcular max seats ---- //
    const selectedSpace = spaces.find(s => s.id === selectedSpaceId);
    const minRemainingCapacity = selectedSlots.length > 0 ? Math.min(...selectedSlots.map(si => {
        const slot = slots.find(s => s.slotIndex === si);
        return slot ? slot.remainingCapacity : 0;
    })) : 0;
    const seatsModalMax = selectedSpace?.maxSeatsPerBooking ? Math.min(selectedSpace.maxSeatsPerBooking, minRemainingCapacity) : minRemainingCapacity;

    // ---- Info de la seleccion ---- //
    const selectionInfo = selectedSlots.length > 0 ? (() => {
        const first = slots.find(s => s.slotIndex === selectedSlots[0]);
        const last = slots.find(s => s.slotIndex === selectedSlots[selectedSlots.length - 1]);
        return first && last ? `${first.startTime} - ${last.endTime} (${selectedSlots.length} ${selectedSlots.length === 1 ? 'slot' : 'slots'})` : '';
    })() : '';

    //Configuración de pestañas y opciones de filtro por alcance temporal
    const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
        { key: 'calendar', label: 'Calendario', icon: <CalendarDays className='h-4 w-4' /> },
        { key: 'myBookings', label: 'Mis Reservas', icon: <List className='h-4 w-4' /> },
        ...(isAdmin ? [{ key: 'allBookings' as Tab, label: 'Todas las Reservas', icon: <Users className='h-4 w-4' /> }] : [])
    ];

    const scopeOptions = [
        { value: 'upcoming', label: 'Próximas' },
        { value: 'past', label: 'Pasadas' },
        { value: 'cancelled', label: 'Canceladas' },
        { value: 'all', label: 'Todas' },
    ];

    return (
        <div className='min-h-screen bg-gray-50/30'>
            <Header
                showCommunutySwitcher={true}
                navLinks={[
                    { label: <><Menu className='h-4 w-4 inline mr-1' /> Comunidad</>, path: '#', onClick: () => setSidebarOpen(true) },
                    { label: 'Calendario', path: '/calendar' },
                    { label: 'Ayuda', path: '/help' }
                ]}
            />

            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <main className='max-w-[1000px] mx-auto pt-[250px] md:pt-[200px] px-4 md:px-0 pb-12'>
                <div className='flex justify-between items-center mb-6'>
                    <h1 className='text-[28px] font-bold text-gray-900'>Reserva de espacios</h1>
                    {isAdmin && (
                        <Button size='sm' variant='outline' className='flex items-center gap-2' onClick={() => navigate('/space-management')}>
                            <Settings className='h-4 w-4' /> Gestionar espacios
                        </Button>
                    )}
                </div>

                {/*Pestañas de navegación: calendario, mis reservas y todas(admin)*/}
                <div className='flex gap-1 bg-gray-100 p-1 rounded-xl mb-6 w-fit'>
                    {tabs.map(tab => (
                        <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === tab.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </div>

                {/*Sección calendario: selector de fecha + selector de espacio + grid de slots horarios + confirmación*/}
                {activeTab === 'calendar' && (
                    <div className='flex flex-col md:flex-row gap-8'>
                        <div className='bg-white p-4 rounded-2xl shadow-sm border border-gray-200 md:w-[350px] h-fit'>
                            <Calendar
                                mode='single'
                                selected={selectedDate}
                                onSelect={setSelectedDate}
                                locale={es}
                                className='rounded-md w-full flex justify-center'
                                classNames={{
                                    day: 'h-11 w-11 flex items-center justify-center text-sm p-0 font-medium hover:bg-gray-100 rounded-md cursor-pointer', day_selected: 'bg-blue-600 text-white hover:bg-blue-600 hover:text-white rounded-md',
                                    day_today: 'bg-blue-50 text-blue-600 font-bold'
                                }}
                            />
                        </div>

                        <div className='flex-1'>
                            <h2 className='text-xl font-bold mb-4 text-gray-900'>
                                {selectedDate ? format(selectedDate, "d 'de' MMMM", { locale: es }) : 'Selecciona una fecha'}
                            </h2>

                            {spaces.length === 0 ? (
                                <div className='bg-white p-8 rounded-2xl border border-dashed border-gray-300 text-center'>
                                    <p className='text-gray-500'>No hay espacios disponibles en esta comunidad.</p>
                                    {isAdmin && <p className='text-sm text-gray-400 mt-2'>Crea uno desde "Gestionar espacios".</p>}
                                </div>
                            ) : (
                                <>
                                    <div className='mb-4'>
                                        <label className='text-sm font-semibold text-gray-600 mb-1.5 block'>Espacio</label>
                                        <select className='w-full h-[42px] border border-gray-200 rounded-xl px-4 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400' value={selectedSpaceId || ''} onChange={(e) => setSelectedSpaceId(e.target.value)}>
                                            {spaces.map(space => (
                                                <option value={space.id} key={space.id}>{space.name} - {space.occupancyMode === 'SHARED' ? `Compartido (${space.totalCapacity} plazas)` : 'Uso exclusivo'}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {selectedSpace && (
                                        <div className='flex items-center gap-3 mb-4 text-xs text-gray-500'>
                                            <div className='w-3 h-3 rounded-full' style={{ backgroundColor: selectedSpace.colorHex }} />
                                            <span>{selectedSpace.openingTime} - {selectedSpace.closingTime}</span>
                                            <span>·</span>
                                            <span>Slots de {selectedSpace.slotMinutes} min</span>

                                            {bookingRules && (
                                                <>
                                                    <span>·</span>
                                                    <span>Máx. {bookingRules.maxConsecutiveSlots} consecutivos</span>
                                                </>
                                            )}
                                        </div>
                                    )}

                                    {loadingAvailability ? (
                                        <div className='bg-white p-8 rounded-2xl border border-gray-200 text-center'>
                                            <p className='text-gray-400'>Cargando disponibilidad...</p>
                                        </div>
                                    ) : availabilityError ? (
                                        <div className='bg-white p-8 rounded-2xl border border-red-200 text-center'>
                                            <p className='text-red-500 text-sm'>{availabilityError}</p>
                                        </div>
                                    ) : slots.length > 0 ? (
                                        <div className='bg-white p-5 rounded-2xl shadow-sm border border-gray-200'>
                                            <p className='text-sm font-semibold text-gray-600 mb-3'>Horarios disponibles</p>
                                            <div className='grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2'>
                                                {slots.map(slot => {
                                                    const isSelected = selectedSlots.includes(slot.slotIndex);
                                                    const isAvailable = slot.available;

                                                    return (
                                                        <button key={slot.slotIndex} onClick={() => handleSlotsClick(slot.slotIndex)} disabled={!isAvailable} className={`relative flex flex-col items-center justify-center py-3 px-2 rounded-xl border-2 text-sm font-medium transition-all ${isSelected ? 'bg-emerald-500 border-emerald-600 text-white shadow-md scale-105' : isAvailable ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100 hover:border-emerald-300 cursor-pointer' : 'bg-red-50 border-red-200 text-red-400 opacity-60 cursor-not-allowed'}`}>
                                                            <span className='text-xs font-bold'>{slot.startTime}</span>
                                                            <span className='text-[10px] opacity-70'>{slot.endTime}</span>
                                                            {selectedSpace?.occupancyMode === 'SHARED' && isAvailable && (
                                                                <span className={`text-[9px] mt-0.5 ${isSelected ? 'text-emerald-100' : 'text-gray-400'}`}>
                                                                    {slot.remainingCapacity} libres
                                                                </span>
                                                            )}
                                                        </button>
                                                    );
                                                })}
                                            </div>

                                            <div className='flex gap-4 mt-4 text-xs text-gray-400 border-t border-gray-100 pt-3'>
                                                <div className='flex items-center gap-1.5'>
                                                    <div className='w-3 h-3 rounded bg-emerald-50 border border-emerald-200' /> Disponible
                                                </div>

                                                <div className='flex items-center gap-1.5'>
                                                    <div className='w-3 h-3 rounded bg-emerald-500' /> Seleccionado
                                                </div>

                                                <div className='flex items-center gap-1.5'><div className='w-3 h-3 rounded bg-red-50 border border-red-200 opacity-60' /> Ocupado</div>
                                            </div>

                                            {selectedSlots.length > 0 && (
                                                <div className='flex items-center justify-between mt-4 pt-4 border-t border-gray-100'>
                                                    <p className='text-sm text-gray-600'>
                                                        <span className='font-semibold'>Selección:</span> {selectionInfo}
                                                    </p>
                                                    <Button size='sm' onClick={handleConfirmBooking}>Confirmar reserva</Button>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className='bg-white p-8 rounded-2xl border border-dashed border-gray-300 text-center'>
                                            <p className='text-gray-500'>No hay horarios disponibles para este día.</p>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                )}

                {/*Sección mis reservas: filtro de alcance(próximas/pasadas/canceladas/todas) + listado con BookingCard*/}
                {activeTab === 'myBookings' && (
                    <div>
                        <div className='flex gap-2 mb-5 flex-wrap'>
                            {scopeOptions.map(opt => (
                                <button key={opt.value} onClick={() => setMyBookingsScope(opt.value)} className={`px-3.5 py-2 rounded-lg text-sm font-medium border transition-colors ${myBookingsScope === opt.value ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-500 border-gray-200 hover:border-blue-300'}`}>
                                    {opt.label}
                                </button>
                            ))}
                        </div>

                        <div className='flex flex-col gap-4'>
                            {myBookings.map(booking => (
                                <BookingCard key={booking.id} booking={booking} onCancel={handleOpenCancel} />
                            ))}
                        </div>

                        {myBookingHasMore && (
                            <div className='text-center py-6'>
                                <Button variant='outline' onClick={() => { const next = myBookingsPage + 1; setMyBookingsPage(next); loadMyBookings(next, true); }} disabled={loadingMyBookings}>
                                    {loadingMyBookings ? 'Cargando...' : 'Cargar más reservas'}
                                </Button>
                            </div>
                        )}
                        {!myBookingHasMore && myBookings.length > 0 && <p className='text-center text-gray-400 text-sm py-6'>No hay más reservas.</p>}
                        {myBookings.length === 0 && !loadingMyBookings && <p className='text-center text-gray-400 text-sm py-6'>No tienes reservas registradas.</p>}
                    </div>
                )}

                {/*Sección todas las reservas: filtro de estado + listado con BookingCard mostrando propietario*/}
                {activeTab === 'allBookings' && isAdmin && (
                    <div>
                        <div className='flex gap-2 mb-5 flex-wrap'>
                            {[{ value: 'active', label: 'Activas' }, { value: 'cancelled', label: 'Canceladas' }, { value: 'all', label: 'Todas' }].map(opt => (
                                <button key={opt.value} onClick={() => setAllBookingsStatus(opt.value)} className={`px-3.5 py-2 rounded-lg text-sm font-medium border transition-colors ${allBookingsStatus === opt.value ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-500 border-gray-200 hover:border-blue-300'}`}>
                                    {opt.label}
                                </button>
                            ))}
                        </div>

                        <div className='flex flex-col gap-4'>
                            {allBookings.map(booking => (
                                <BookingCard key={booking.id} booking={booking} showOwner onCancel={handleOpenCancel} />
                            ))}
                        </div>

                        {allBookingsHasMore && (
                            <div className='text-center py-6'>
                                <Button variant='outline' onClick={() => { const next = allBookingsPage + 1; setAllBookingPage(next); loadAllBookings(next, true); }} disabled={loadingAllBookings}>
                                    {loadingAllBookings ? 'Cargando...' : 'Cargar más reservas'}
                                </Button>
                            </div>
                        )}
                        {!allBookingsHasMore && allBookings.length > 0 && <p className='text-center text-gray-400 text-sm py-6'>No hay más reservas.</p>}
                        {allBookings.length === 0 && !loadingAllBookings && <p className='text-center text-gray-400 text-sm py-6'>No hay reservas en la comunidad.</p>}
                    </div>
                )}

            </main>

            {/*Modales: selección de plazas (espacio compartido), cancelación de reserva con motivo y feedback*/}
            <SeatsModal
                isOpen={isSeatsModalOpen}
                onClose={() => setIsSeatsModalOpen(false)}
                onConfirm={(seats) => executeBooking(seats)}
                maxSeats={seatsModalMax}
                totalCapacity={selectedSpace?.totalCapacity || 0}
            />

            <CancelBookingModal
                isOpen={isCancelModalOpen}
                onClose={() => { setIsCancelModalOpen(false); setCancellingBookingId(null); }}
                onConfirm={handleConfirmCancel}
            />

            <FeedbackModal 
                    isOpen={feedback.isOpen}
                    type={feedback.type}
                    message={feedback.message}
                    onClose={closeFeedback}
                />
        </div>
    );
};

export default ReservationsPage;