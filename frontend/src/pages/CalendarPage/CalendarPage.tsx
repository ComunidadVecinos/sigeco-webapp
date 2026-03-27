import React, {useEffect, useState} from 'react';
import Header from '@/components/common/Header/Header';
import Sidebar from '@/components/ui/Sidebar/Sidebar';
import {Menu, Plus, Clock, Pencil, Trash2} from 'lucide-react';
import { useAuth } from '@/context/authContext';
import { Button, buttonVariants } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { format, isSameDay } from 'date-fns';
import {es} from 'date-fns/locale';
import CreateEventCalendarModal from '@/components/ui/CreateEventCalendarModal/CreateEventCalendarModal';
import { getCalendarEvents, createPersonalEvent, deletePersonalEvent, updatePersonalEvent } from '@/services/calendarService';

interface CalendarEvent {
    id: number;
    title: string;
    time: string;
    type: 'community' | 'personal' | 'reservation' | 'votes';
    date: string;
}

const CalendarPage: React.FC = () => {
    const { user } = useAuth();
    const communityId = user?.activeCommunityId;

    //Rol del usuario
    const activeCommunity: any = user?.communities?.find((c: any) => c.communityId === communityId);
    const isAdmin = activeCommunity?.role === 'PRESIDENT' || activeCommunity?.role === 'VICE_PRESIDENT';

    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [date, setDate] = useState<Date | undefined>(new Date());

    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [loading, setLoading] = useState(false);
    const [featureUnavailable, setFeatureUnavailable] = useState(false);
    const [isEventModalOpen, setIsEventModalOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);

    //Cargar eventos
    const loadEvents = async () => {
        if(!communityId) return;
        setLoading(true);
        try{
            setFeatureUnavailable(false);
            const res : any = await getCalendarEvents(communityId);
            setEvents(res.data.content || []);
        } catch(error: any){
            if(error?.response?.status === 404){
                setFeatureUnavailable(true);
                setEvents([]);
            }
            console.error("Error cargando eventos", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {loadEvents(); }, [communityId]);

    //Filtrar por el dia seleccionado
    const selectedDateEvents = events.filter(e => {
        if(!date) return false;
        return isSameDay(new Date(e.date), date);
    });

    //Crear evento personal
    const handleCreateEvent = async (newEventData: any) => {
        if(!communityId) return;
        if(featureUnavailable) return;
        try{
            const res: any = await createPersonalEvent(communityId, newEventData);
            setEvents([...events, res.data]);
            setIsEventModalOpen(false);
        } catch(err: any){
            alert(err.response?.data?.error?.message || 'Error al guardar el evento');
        }
    };

    //Editar evento personal
    const handleEditEvent = async (eventData: any) => {
        if(!communityId || !editingEvent) return;
        if(featureUnavailable) return;
        try{
            const res: any = await updatePersonalEvent(communityId, editingEvent.id, eventData);
            setEvents(events.map(e => e.id === editingEvent.id ? {...e, ...eventData} : e));
            setEditingEvent(null);
            setIsEventModalOpen(false);
        } catch(err: any){
            alert(err.response?.data?.error?.message || 'Error al editar');
        }
    };

    const handleOpenEdit = (event: CalendarEvent) => {
        setEditingEvent(event);
        setIsEventModalOpen(true);
    };

    //Borrar evento personal
    const handleDeleteEvent = async (eventId: number) => {
        if(!communityId || !confirm("¿Eliminar este evento?")) return;
        if(featureUnavailable) return;
        try{
            await deletePersonalEvent(communityId, eventId);
            setEvents(events.filter(e => e.id !== eventId));
        } catch(err: any) {
            alert(err.response?.data?.error?.message || 'Error al eliminar');
        }
    };

    return (
        <div className='min-h-screen bg-gray-50/30'>
            <Header
                showCommunutySwitcher={true}
                navLinks={[
                    {label: <><Menu className='h-4 w-4 inline mr-1' /> Comunidad</>, path: '#', onClick: () => setSidebarOpen(true)},
                    {label: 'Calendario', path: '/calendar'},
                    {label: 'Ayuda', path: '/help'}
                ]}
            />

            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <main className='max-w-[1000px] mx-auto pt-[250px] md:pt-[200px] px-4 md:px-0 pb-12'>
                <div className='flex justify-between items-center mb-6'>
                    <h1 className='text-[28px] font-bold text-gray-900'>Mi Calendario</h1>
                    <Button size="sm" className='flex items-center gap-2' onClick={() => setIsEventModalOpen(true)} disabled={featureUnavailable}>
                        <Plus className='h-4 w-4' />Evento Personal
                    </Button>
                </div>

                {featureUnavailable && (
                    <div className='bg-white p-6 rounded-2xl border border-amber-200 text-amber-800 mb-6'>
                        El backend actual no expone todavía el módulo de calendario. La pantalla queda visible, pero sus datos y acciones no están disponibles en esta arquitectura.
                    </div>
                )}

                {/* Leyenda de colores */}
                <div className="flex gap-4 mb-6 text-sm font-medium text-gray-600 border-b border-gray-200 pb-4">
                    <div className="flex items-center gap-1.5"><div className='w-2.5 h-2.5 rounded-full bg-red-500'></div>Incidencia</div>
                    <div className="flex items-center gap-1.5"><div className='w-2.5 h-2.5 rounded-full bg-blue-500'></div>Reserva</div>
                    <div className="flex items-center gap-1.5"><div className='w-2.5 h-2.5 rounded-full bg-yellow-500'></div>Votaciones</div>
                    <div className="flex items-center gap-1.5"><div className='w-2.5 h-2.5 rounded-full bg-green-500'></div>Personal</div>
                </div>

                <div className='flex flex-col md:flex-row gap-8'>
                    {/* Calendario interactivo */}
                    <div className='bg-white p-4 rounded-2xl shadow-sm border border-gray-200 md:w-[350] h-fit'>
                        <Calendar
                            mode='single'
                            selected={date}
                            onSelect={setDate}
                            locale={es}
                            className='rounded-md w-full flex justify-center'
                            classNames={{
                                day: "h-11 w-11 flex items-center justify-center text-sm p-0 font-medium hover:bg-gray-100 rounded-md cursor-pointer",
                                day_selected: "bg-blue-600 text-white hover:bg-blue-600 hover:text-white rounded-md",
                                day_today: "bg-blue-50 text-blue-600 font-bold",
                            }}
                            components={{
                                DayButton: ({day, modifiers, ...props}) => {
                                    const dayEvents = events.filter(e => isSameDay(new Date(e.date), day.date));
                                    const uniqueTypes = [...new Set(dayEvents.map(e => e.type))];
                                    const colorMap: Record<string, string> = {
                                        community: 'bg-red-500',
                                        reservation: 'bg-blue-500',
                                        votes: 'bg-yellow-500',
                                        personal: 'bg-green-500'
                                    };
                                    return (
                                        <button {...props} className={`flex flex-col items-center justify-center w-full h-full rounded-md ${modifiers.selected ? 'bg-blue-600 text-white' : modifiers.today ? 'bg-blue-50 text-blue-600 font-bold' : 'hover:bg-gray-100'}`}>
                                            <span>{day.date.getDate()}</span>
                                            {uniqueTypes.length > 0 && (
                                                <div className='flex gap-0.5 mt-0.5'>
                                                    {uniqueTypes.map(t => (
                                                        <div key={t} className={`w-1.5 h-1.5 rounded-full ${colorMap[t] || 'bg-gray-400'}`}></div>
                                                    ))}
                                                </div>
                                            )}
                                        </button>
                                    );
                                }
                            }}
                        />
                    </div>

                    {/*Eventos del dia seleccionado */}
                    <div className="flex-1">
                        <h2 className='text-xl font-bold mb-4 text-gray-900'>
                            Agenda del {date ? format(date, "d 'de' MMMM", {locale: es}) : 'dia'}
                        </h2>

                        <div className="flex flex-col gap-4">
                            {loading ? (
                                <p className='text-gray-400 text-center py-10'>Cargando...</p>
                            ) : selectedDateEvents.length > 0 ? (
                                selectedDateEvents.map(event => (
                                    <div key={event.id} className='bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-3 hover:border-gray-200 transition-colors group relative'>

                                        {event.type === 'personal' && (
                                            <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => handleOpenEdit(event)} className='text-gray-300 hover:text-blue-500' title='Editar'>
                                                    <Pencil className='w-4 h-4' />
                                                </button>
                                                <button onClick={() => handleDeleteEvent(event.id)} className='text-gray-300 hover:text-red-500' title='Eliminar'>
                                                <Trash2 className='w-4 h-4' />
                                            </button>
                                            </div>
                                        )}

                                        <div className='flex items-center gap-2'>
                                            <div className={`w-2.5 h-2.5 rounded-full ${event.type === 'community' ? 'bg-red-500' : event.type === 'reservation' ? 'bg-blue-500' : event.type === 'votes' ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
                                            <h3 className='font-bold text-lg text-gray-900'>{event.title}</h3>
                                        </div>

                                        <div className='flex flex-col gap-2 text-sm text-gray-500 ml-4'>
                                            <div className='flex items-center gap-2'>
                                                <Clock className='w-4 h-4 text-gray-400' /><span>{event.time}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className='bg-white p-8 rounded-2xl border border-dashed border-gray-300 text-center'>
                                    <p className='text-gray-500'>No hay eventos programados para este dia.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            <CreateEventCalendarModal
                isOpen={isEventModalOpen}
                onClose={() => {setIsEventModalOpen(false); setEditingEvent(null);}}
                onSave={editingEvent ? handleEditEvent : handleCreateEvent}
                selectedDate={date}
                editingEvent={editingEvent}
            />
        </div>
    );
};

export default CalendarPage;
