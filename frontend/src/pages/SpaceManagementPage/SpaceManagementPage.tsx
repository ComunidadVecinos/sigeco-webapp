import React, {useEffect, useState} from 'react';
import Header from '@/components/common/Header/Header';
import Sidebar from '@/components/ui/Sidebar/Sidebar';
import CreateEditSpaceModal from '@/components/ui/CreateEditSpaceModal/CreateEditSpaceModal';
import { Menu, Plus, ArrowLeft, Clock, CalendarDays, ToggleLeft, ToggleRight, Trash2, Pencil } from 'lucide-react';
import { useAuth } from '@/context/authContext';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { getSpaces, createSpace, changeSpaceStatus, deleteSpace, updateSpace, type Space} from '@/services/reservationService';
import FeedbackModal from '@/components/ui/FeedbackModal/FeedbackModal';
import ConfirmModal from '@/components/ui/ConfirmModal/ConfirmModal';


const DAY_LABELS: Record<string, string> = {
    monday: 'Lunes', tuesday: 'Martes', wednesday: 'Miércoles', thursday: 'Jueves', friday: 'Viernes', saturday: 'Sábado', sunday: 'Domingo'
};

const SpaceManagementPage: React.FC = () => {
    const navigate = useNavigate();
    const {user, loading: authLoading} = useAuth();
    const communityId = user?.activeCommunityId;
    const activeCommunity: any = user?.communities?.find((c: any) => c.communityId === communityId);
    const isAdmin = activeCommunity?.role === 'PRESIDENT' || activeCommunity?.role === 'VICE_PRESIDENT';

    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [spaces, setSpaces] = useState<Space[]>([]);
    const [selectedSpaceId, setSelectedSpaceId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [isCreateSpaceOpen, setIsCreateSpaceOpen] = useState(false);
    const [spaceToEdit, setSpaceToEdit] = useState<Space | null>(null);

    const [feedback, setFeedback] = useState<{isOpen: boolean, type: 'success' | 'error', message: string}>({isOpen: false, type: 'success', message: ''});
    const closeFeedback = () => setFeedback(prev => ({...prev, isOpen: false}));

    const [confirmAction, setConfirmAction] = useState<{isOpen: boolean; type: 'toggleStatus' | 'deleteSpace' | null; title: string; message: string;}>({isOpen: false, type: null, title: '', message: ''});
    

    // ---- Redirect si no es admin o no existe la comunidad ---- //
    useEffect(() => {
        if(!authLoading && user && !communityId){
            navigate('/auth/me', {replace: true});
        }
        if(!authLoading && user && communityId && !isAdmin){
            navigate('/reservations', {replace: true});
        }
    }, [authLoading, communityId, navigate, user, isAdmin]);

    // ---- Cargar todos los espacios de la comunidad independiente del estado ---- //
    const loadSpaces = async () => {
        if(!communityId) return;
        setLoading(true);

        try{
            const res = await getSpaces(communityId, {status: 'all', pageSize: 100});
            const items = res.data.items || [];
            setSpaces(items);
            if(selectedSpaceId && !items.find(s => s.id === selectedSpaceId)){
                setSelectedSpaceId(null);
            }
        } catch(err){
            console.error('Error cargando espacios', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {loadSpaces(); }, [communityId]);

    const selectedSpace = spaces.find(s => s.id === selectedSpaceId) || null;

    // ---- Crear espacio ---- //
    const handleCreateSpace = async (data: any) => {
        if(!communityId) return;
        try{
            const res = await createSpace(communityId, data);
            const newSpace = res.data.space;
            setSpaces(prev => [...prev, newSpace]);
            setSelectedSpaceId(newSpace.id);
            setIsCreateSpaceOpen(false);
        } catch (err){
            setFeedback({isOpen: true, type: 'error', message: (err as any).response?.data?.error?.message || 'Error al crear el espacio'});
        }
    };

    // --- Modificar espacio --- //
    const handelEditSpace = async (data: any) => {
        if(!communityId || !spaceToEdit) return;
        try{
            const {isActive, ...updateData} = data;

            if(!updateData.description) updateData.description = null;
            if(updateData.occupancyMode === 'EXCLUSIVE') updateData.maxSeatsPerBooking = null;

            const res = await updateSpace(communityId, spaceToEdit.id, updateData);

            setSpaces(prev => prev.map(s => s.id == spaceToEdit.id ? res.data.space : s));
            setSpaceToEdit(null);
        } catch (err){
            setFeedback({isOpen:true, type: 'error', message: (err as any).response?.data?.error?.message || 'Error al editar el espacio'});
        }
    }

    // ---- Cambiar estado de un espacio ---- //
    const handleToogleStatus = async () => {
        if(!communityId || !selectedSpace) return;
        const newStatus = !selectedSpace.isActive;

        try{
            const res = await changeSpaceStatus(communityId, selectedSpace.id, newStatus);
            setSpaces(prev => prev.map(s => s.id === selectedSpace.id ? res.data.space : s));
        } catch(err){
            setFeedback({isOpen: true, type: 'error', message: (err as any).response?.data?.error?.message || 'Error al cambiar el estado.'});
        }
    };

    // ---- Eliminar un espacio ---- //
    const handleDeleteSpace = async () => {
        if(!communityId || !selectedSpace) return;

        try{
            await deleteSpace(communityId, selectedSpace.id);
            setSpaces(prev => prev.filter(s => s.id !== selectedSpace.id));
            setSelectedSpaceId(null);
        } catch (err) {
            setFeedback({isOpen: true, type: 'error', message: (err as any).response?.data?.error?.message || 'Error al eliminar el espacio'});
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

            <main className='max-w-[1100px] mx-auto pt-[250px] md:pt-[200px] px-4 md:px-0 pb-12'>
                <div className='flex justify-between items-center mb-6'>
                    <h1 className='text-[28px] font-bold text-gray-900'>Gestión de espacios</h1>
                    <div className='flex gap-2'>
                        <Button size='sm' className='flex items-center gap-2' onClick={() => setIsCreateSpaceOpen(true)}>
                            <Plus className='h-4 w-4' /> Crear espacio
                        </Button>
                        <Button size='sm' variant='outline' className='flex items-center gap-2' onClick={() => navigate('/reservations')}>
                            <ArrowLeft className='h-4 w-4' /> Volver a reservas
                        </Button>
                    </div>
                </div>

                <div className='flex flex-col md:flex-row gap-6'>
                    <div className='md:w-[320px] shrink-0'>
                        <div className='bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden'>
                            <div className='p-4 border-b border-gray-100'>
                                <p className='text-sm font-semibold text-gray-600'>{spaces.length} {spaces.length === 1 ? 'espacio' : 'espacios'}</p>
                            </div>

                            {loading ? (
                                <div className='p-6 text-center text-gray-400 text-sm'>Cargando...</div>
                            ) : spaces.length === 0 ? (
                                <div className='p-6 text-center text-gray-400 text-sm'>
                                    No hay espacios creados. <br /> Crea uno con el botón de arriba.
                                </div>
                            ) : (
                                <div className='flex flex-col'>
                                    {spaces.map(space => (
                                        <button key={space.id} onClick={() => setSelectedSpaceId(space.id)} className={`flex items-center gap-3 px-4 py-3.5 text-left transition-colors border-b border-gray-50 last:border-b-0 ${selectedSpaceId === space.id ? 'bg-blue-50 border-l-[3px] border-l-blue-500' : 'hover:bg-gray-50 border-l-[3px] border-l-transparent'}`}>
                                            <div className='w-3 h-3 rounded-full shrink-0' style={{backgroundColor: space.colorHex}} />
                                            <div className='flex-1 min-w-0'>
                                                <p className={`text-sm font-medium truncate ${selectedSpaceId === space.id ? 'text-blue-700' : 'text-gray-800'}`}>
                                                    {space.name}
                                                </p>
                                                <p className='text-xs text-gray-400'>
                                                    {space.occupancyMode === 'SHARED' ? 'Compartido' : 'Exclusivo'} · {space.totalCapacity} plazas
                                                </p>
                                            </div>
                                            <span className={`w-2 h-2 rounded-full shrink-0 ${space.isActive ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    
                    <div className='flex-1'>
                        {!selectedSpace ? (
                            <div className='bg-white p-12 rounded-2xl border border-dashed border-gray-300 text-center'>
                                <CalendarDays className='h-12 w-12 text-gray-300 mx-auto mb-3' />
                                <p className='text-gray-500'>Selecciona un espacio de la lista para ver sus detalles.</p>
                            </div>
                        ) : (
                            <div className='bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden'>
                                <div className='p-6 border-b border-gray-100'>
                                    <div className='flex items-start justify-between'>
                                        <div className='flex items-center gap-3'>
                                            <div className='w-5 h-5 rounded-lg' style={{backgroundColor: selectedSpace.colorHex}} />
                                            <div>
                                                <h2 className='text-xl font-bold text-gray-900'>{selectedSpace.name}</h2>
                                                {selectedSpace.description && (
                                                    <p className='text-sm text-gray-500 mt-1'>{selectedSpace.description}</p>
                                                )}
                                            </div>
                                        </div>
                                        <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wide ${selectedSpace.isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-gray-100 text-gray-500 border border-gray-200'}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${selectedSpace.isActive ? 'bg-emerald-500' : 'bg-gray-400'}`}/>
                                            {selectedSpace.isActive ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </div>
                                </div>

                                <div className='p-6 space-y-6'>
                                    <div>
                                        <h3 className='text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide'>Capacidad</h3>
                                        <div className='grid grid-cols-2 sm:grid-cols-3 gap-4'>
                                            <div className='bg-gray-50 rounded-xl p-3'>
                                                <p className='text-xs text-gray-400 mb-1'>Modo</p>
                                                <p className='text-sm font-semibold text-gray-700'>
                                                    {selectedSpace.occupancyMode === 'SHARED' ? 'Compartido' : 'Exclusivo'}
                                                </p>
                                            </div>
                                            <div className='bg-gray-50 rounded-xl p-3'>
                                                <p className='text-xs text-gray-400 mb-1'>Capacidad total</p>
                                                <p className='text-sm font-semibold text-gray-700'>
                                                    {selectedSpace.totalCapacity} plazas
                                                </p>
                                            </div>
                                            {selectedSpace.occupancyMode === 'SHARED' && selectedSpace.maxSeatsPerBooking && (
                                                <div className='bg-gray-50 rounded-xl p-3'>
                                                    <p className='text-xs text-gray-400 mb-1'>Máx. plazas</p>
                                                    <p className='text-sm font-semibold text-gray-700'>{selectedSpace.maxSeatsPerBooking}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className='text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide'>Horario</h3>
                                        <div className='grid grid-cols-2 sm:grid-cols-3 gap-4'>
                                            <div className='bg-gray-50 rounded-xl p-3'>
                                                <p className='text-xs text-gray-400 mb-1'>Apertura</p>
                                                <p className='text-sm font-semibold text-gray-700 flex items-center gap-1.5'>
                                                    <Clock className='h-3.5 w-3.5 text-gray-400' /> {selectedSpace.openingTime}
                                                </p>
                                            </div>
                                            <div className='bg-gray-50 rounded-xl p-3'>
                                                <p className='text-xs text-gray-400 mb-1'>Cierre</p>
                                                <p className='text-sm font-semibold text-gray-700 flex items-center gap-1.5'>
                                                    <Clock className='h-3.5 w-3.5 text-gray-400' /> {selectedSpace.closingTime}
                                                </p>
                                            </div>
                                            <div className='bg-gray-50 rounded-xl p-3'>
                                                <p className='text-xs text-gray-400 mb-1'>Duracion slot</p>
                                                <p className='text-sm font-semibold text-gray-700'>
                                                    {selectedSpace.slotMinutes} minutos
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className='text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide'>Días permitidos</h3>
                                        <div className='flex gap-2 flex-wrap'>
                                            {Object.entries(DAY_LABELS).map(([key, label]) => {
                                                const enabled = selectedSpace.allowedDays[key as keyof typeof selectedSpace.allowedDays];

                                                return(
                                                    <span
                                                        key={key}
                                                        className={`px-3 py-1.5 rounded-lg text-xs font-medium ${enabled ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-gray-50 text-gray-400 border border-gray-200 line-through'}`}>
                                                            {label}
                                                    </span>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className='text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide'>Reglas de reserva</h3>
                                        <div className='grid grid-cols-2 gap-4'>
                                            <div className='bg-amber-50/50 rounded-xl p-3 border border-amber-100'>
                                                <p className='text-xs text-gray-400 mb-1'>Máx. slots consecutivos</p>
                                                <p className='text-sm font-semibold text-gray-700'>{selectedSpace.maxConsecutiveSlots}</p>
                                            </div>
                                            <div className='bg-amber-50/50 rounded-xl p-3 border border-amber-100'>
                                                <p className='text-xs text-gray-400 mb-1'>Antelación mínima</p>
                                                <p className='text-sm font-semibold text-gray-700'>{selectedSpace.minAdvanceMinutes} min</p>
                                            </div>
                                            <div className='bg-amber-50/50 rounded-xl p-3 border border-amber-100'>
                                                <p className='text-xs text-gray-400 mb-1'>Máx. dias de antelación</p>
                                                <p className='text-sm font-semibold text-gray-700'>{selectedSpace.maxAdvanceDays} días</p>
                                            </div>
                                            <div className='bg-amber-50/50 rounded-xl p-3 border border-amber-100'>
                                                <p className='text-xs text-gray-400 mb-1'>Margen cancelación</p>
                                                <p className='text-sm font-semibold text-gray-700'>{selectedSpace.cancellationNoticeMinutes} min</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className='p-6 border-t border-gray-100 flex gap-3 flex-wrap'>
                                    <Button
                                        size='sm'
                                        variant='outline'
                                        className='text-blue-600 border-blue-200 hover:bg-blue-50 flex items-center gap-2'
                                        onClick={() => setSpaceToEdit(selectedSpace)}
                                    >
                                        <Pencil className='h-4 w-4' /> Editar
                                    </Button>
                                    <Button
                                        size='sm'
                                        variant='outline'
                                        className={`flex items-center gap-2 ${selectedSpace.isActive ? 'text-amber-600 border-amber-200 hover:bg-amber-50' : 'text-emerald-600 border-emerald-200 hover:bg-emerald-50'}`}
                                        onClick={() => setConfirmAction({isOpen: true, type: 'toggleStatus', title: selectedSpace.isActive ? 'Desactivar Espacio' : 'Activar Espacio', message: `¿${selectedSpace.isActive ? 'Desactivar' : 'Activar'} el espacio "${selectedSpace.name}"?`})}
                                    >
                                        {selectedSpace.isActive ? <ToggleLeft className='h-4 w-4' /> : <ToggleRight className='h-4 w-4' />}
                                        {selectedSpace.isActive ? 'Desactivar' : 'Activar'}
                                    </Button>
                                    <Button
                                        size='sm'
                                        variant='outline'
                                        className='text-red-600 border-red-200 hover:bg-red-50 flex items-center gap-2'
                                        onClick={() => setConfirmAction({isOpen: true, type: 'deleteSpace', title: 'Eliminar Espacio', message: `¿Eliminar el espacio ${selectedSpace.name}"? Esta acción no se puede deshacer. `})}
                                    >
                                        <Trash2 className='h-4 w-4' /> Eliminar
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            <CreateEditSpaceModal 
                isOpen={isCreateSpaceOpen || spaceToEdit !== null}
                onClose={() => {setIsCreateSpaceOpen(false); setSpaceToEdit(null);}}
                onSave={(data) => spaceToEdit ? handelEditSpace(data) : handleCreateSpace(data)}
                spaceToEdit={spaceToEdit}
            />

            <ConfirmModal
                isOpen={confirmAction.isOpen}
                onClose={() => setConfirmAction({...confirmAction, isOpen: false})}
                title={confirmAction.title}
                message={confirmAction.message}
                onConfirm={async () => {
                    if(confirmAction.type === 'toggleStatus') await handleToogleStatus();
                    if(confirmAction.type === 'deleteSpace') await handleDeleteSpace();
                }}
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

export default SpaceManagementPage;