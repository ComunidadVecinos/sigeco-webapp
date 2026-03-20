import React, {useState} from 'react';
import Header from '@/components/common/Header/Header';
import Sidebar from '@/components/ui/Sidebar/Sidebar';
import {Menu, Plus, Clock, MapPin} from 'lucide-react';
import { useAuth } from '@/context/authContext';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import {es} from 'date-fns/locale';

const CalendarPage: React.FC = () => {
    const { user } = useAuth();
    const communityId = user?.activeCommunityId;

    //Rol del usuario
    const activeCommunity: any = user?.communities?.find((c: any) => c.id === communityId);
    const isAdmin = activeCommunity?.role === 'PRESIDENT' || activeCommunity?.role === 'VICEPRESIDENT';

    const [sidebarOpen, setSidebarOpen] = useState(false);

    const [date, setDate] = useState<Date | undefined>(new Date());

    // Pruebas
    const mockEvents = [
        {
            id: 1,
            title: "Corte de Agua (Reparación)",
            time: "10:00 - 14:00",
            location: "Bloque 2 y 3",
            type: "important", // Para pintar un puntito rojo
            date: new Date()
        },
        {
            id: 2,
            title: "Junta General Extraordinaria",
            time: "19:30 - 21:00",
            location: "Sala de reuniones (Garaje)",
            type: "meeting", // Para pintar un puntito azul
            date: new Date()
        }
    ];

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
                <div className='flex justify-between items-center mb-8'>
                    <h1 className='text-[28px] font-bold text-gray-900'>Calendario Personal</h1>
                    {(
                        <Button size="sm" className='flex items-center gap-2'>
                            <Plus className='h-4 w-4' />
                            Añandir Evento
                        </Button>
                    )}
                </div>

                <div className='flex flex-col md:flex-row gap-8'>
                    <div className='bg-white p-4 rounded-2xl shadow-sm border border-gray-200'>
                        <Calendar
                            mode='single'
                            selected={date}
                            onSelect={setDate}
                            locale={es}
                            className='rounded-md'
                            classNames={{
                                day: "h-12 w-12 text-center text-sm p-0 font-medium hover:bg-gray-100 rounded-md cursor-pointer",
                                day_selected: "bg-blue-600 text-white hover:bg-blue-600 hover:text-white rounded-md",
                                day_today: "bg-blue-50 text-blue-600 font-bold",
                            }}
                        />
                    </div>

                    <div className="flex-1">
                        <h2 className='text-xl font-bold mb-4 text-gray-900'>
                            Eventos para el {date ? format(date, "d 'de' MMMM", {locale: es}) : 'dia seleccionado'}
                        </h2>

                        <div className="flex flex-col gap-4">
                            {mockEvents.length > 0 ? (
                                mockEvents.map(event => (
                                    <div key={event.id} className='bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-3 hover:border-gray-200 transition-colors'>
                                        <div className='flex items-center gap-2'>
                                            <div className={`w-2.5 h-2.5 rounded-full ${event.type === 'important' ? 'bg-red-500' : 'bg-blue-500'}`}></div>
                                            <h3 className='font-bold text-lg text-gray-900'>{event.title}</h3>
                                        </div>
                                        <div className='flex flex-col gap-2 text-sm text-gray-500 ml-4'>
                                            <div className='flex items-center gap-2'>
                                                <Clock className='w-4 h-4 text-gray-400' />
                                                <span>{event.time}</span>
                                            </div>
                                            <div className='flex items-center gap-2'>
                                                <MapPin className='w-4 h-4 text-gray-400' />
                                                <span>{event.location}</span>
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
        </div>
    );
};

export default CalendarPage;