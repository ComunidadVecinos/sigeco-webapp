import React, {useEffect, useState} from 'react';
import Header from '@/components/common/Header/Header';
import Sidebar from '@/components/ui/Sidebar/Sidebar';
import IncidentCard from '@/components/ui/IncidentCard/IncidentCard';
import CreateEditIncidentModal from '@/components/ui/CreateEditIncidentModal/CreateEditIncidentModal';
import ChangeStatusModal from '@/components/ui/ChangeStatusModal/ChangeStatusModal';
import { Menu, Filter, Plus, AlertCircle, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { useAuth } from '@/context/authContext';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { getIncidents, createIncident, updateIncident, deleteIncident, Incident, IncidentStatus, IncidentSummary } from '@/services/incidentService';
import FeedbackModal from '@/components/ui/FeedbackModal/FeedbackModal';
import ConfirmModal from '@/components/ui/ConfirmModal/ConfirmModal';


const summaryCards: {key: keyof Omit<IncidentSummary, 'total'>; label: string; icon: React.ReactNode; bg:string; border: string; text: string }[] = [
    {key: 'pending', label: 'Pendientes', icon: <AlertCircle className='h-5 w-5' />, bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700'},
    {key: 'inProgress', label: 'En proceso', icon: <Clock className='h-5 w-5' />, bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700'},
    {key: 'resolved', label: 'Resueltas', icon: <CheckCircle2 className='h-5 w-5' />, bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700'},
    {key: 'cancelled', label: 'Canceladas', icon: <XCircle className='h-5 w-5' />, bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700'}
];

const statusFilterToApi: Record<string, string> = {
    '': 'open',
    pending: 'pending',
    inProgress: 'inProgress',
    resolved: 'resolved',
    cancelled: 'cancelled',
    all: 'all'
}

const IncidentPage: React.FC = () => {
    const navigate = useNavigate();
    const {user, loading: authLoading} = useAuth();
    const communityId = user?.activeCommunityId;
    const activeCommunity: any = user?.communities?.find((c: any) => c.communityId === communityId);
    const isAdmin = activeCommunity?.role === 'PRESIDENT' || activeCommunity?.role === 'VICE_PRESIDENT';
    const currentMembershipId = activeCommunity?.membershipId;
    
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [incidents, setIncidents] = useState<Incident[]>([]);
    const [summary, setSummary] = useState<IncidentSummary>({total: 0, pending: 0, inProgress: 0, resolved: 0, cancelled: 0});
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);

    const [statusFilter, setStatusFilter] = useState('');

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({title: '', description: '', imageFile: null as File | null, imagePreview: ''});
    const [statusModal, setStatusModal] = useState<{open: boolean; incidentId: string; currentStatus: IncidentStatus}>({open: false, incidentId: '', currentStatus: 'pending'});
    
    const [feedback, setFeedback] = useState<{isOpen: boolean, type: 'success' | 'error', message: string}>({isOpen: false, type: 'success', message: ''});
    const closeFeedback = () => setFeedback(prev => ({...prev, isOpen: false}));

    const [confirmAction, setConfirmAction] = useState<{isOpen: boolean; type: 'delete' | null; idToDelete: string; title: string; message: string;}>({isOpen: false, type: null, idToDelete: '', title: '', message: ''});
    

    useEffect(() => {
        if (!authLoading && user && !communityId) {
            navigate('/auth/me', { replace: true });
        }
    }, [authLoading, communityId, navigate, user]);
    

    //Cargar incidencias
    const loadIncidents = async (pageNum: number, append: boolean = false) => {
        if(!communityId) return;
        setLoading(true);
        try{
            const res: any = await getIncidents(communityId, {
                page: pageNum,
                pageSize: 10,
                status: statusFilterToApi[statusFilter] || 'open'
            });
            const fetched = res.data.items || [];
            setIncidents(prev => append ? [...prev, ...fetched] : fetched);
            setHasMore(!res.data.last);
            setSummary(res.data.summary);
        } catch(err: any){
            console.error('Error cargando incidencias', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {setPage(0); loadIncidents(0);}, [communityId, statusFilter]);

    const handleLoadMore = () => {
        const nextPage = page + 1;
        setPage(nextPage);
        loadIncidents(nextPage, true);
    };

    const handleOpenCreate = () => {
        setFormData({title: '', description: '', imageFile: null, imagePreview: ''});
        setEditingId(null);
        setIsFormOpen(true);
    };

      const handleOpenEdit = (incident: Incident) => {
        setFormData({
            title: incident.title,
            description: incident.description,
            imageFile: null,
            imagePreview: incident.imageUrl || ''
        });
        setEditingId(incident.id);
        setIsFormOpen(true);
    };

    //Guardar incidencia
    const handleSaveIncident = async () => {
        if(!communityId || !formData.title.trim() || !formData.description.trim()) return;
        try{
            if(editingId) {
                await updateIncident(communityId, editingId, formData);
            }else{
                await createIncident(communityId, formData);
            }
            setIsFormOpen(false);
            setFormData({title: '', description: '', imageFile: null as File | null, imagePreview: ''});
            setEditingId(null);
            setPage(0);
            loadIncidents(0);
        } catch (err: any) {
            setFeedback({isOpen: true, type: 'error', message: err.response?.data?.error?.message || 'Error al guardar la incidencia.'});
        }
    };

    const handleDeleteIncident = async (incidentId: string) => {
        if(!communityId) return;
        try{
            await deleteIncident(communityId, incidentId);
            setPage(0);
            loadIncidents(0);
        }
        catch (err: any) {
            setFeedback({isOpen: true, type: 'error', message: err.response?.data?.error?.message || 'Error al eliminar la incidencia.'});
        }
    };

    return (
        <div>
            <Header
                showCommunutySwitcher={true}
                navLinks={[
                    {label: <><Menu className='h-4 w-4 inline mr-1' /> Comunidad</>, path: "#", onClick: () => setSidebarOpen(true)},
                    {label: "Calendario", path: "/calendar"},
                    {label: "Ayuda", path: "/help"}
                ]}
            />

            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)}/>

            <main className='max-w-[700px] mx-auto pt-[250px] md:pt-[200px] px-4 md:px-0'>
                <h1 className='text-[28px] font-bold mb-7 text-center'>Incidencias</h1>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-7">
                    {summaryCards.map(card => (
                        <div key={card.key} className={`${card.bg} ${card.border} border rounded-xl p-4 cursor-pointer transition-shadow hover:shadow-md ${statusFilter === card.key ? 'ring-2 ring-offset-1 ring-gray-400' : ''}`} onClick={() => setStatusFilter(statusFilter === card.key ? '' : card.key)}>
                            <div className={`flex items-center gap-2 ${card.text} mb-1`}>
                                {card.icon}
                                <span className='text-sm font-semibold'>{card.label}</span>
                            </div>
                            <p className={`text-2xl font-bold ${card.text}`}>{summary[card.key]}</p>
                        </div>
                    ))}
                </div>

                <div className="flex justify-between items-center mb-4">

                    <Button onClick={handleOpenCreate} size="sm" className='flex items-center gap-2'>
                        <Plus className='h-4 w-4'/> Reportar Incidencia
                    </Button>

                    <Button variant={statusFilter ? 'default' : 'outline'} size="sm" onClick={() => setStatusFilter(statusFilter ? '' : 'all')} className='flex items-center gap-2'>
                        <Filter className='h-4 w-4' /> {statusFilter ? 'Ver abiertas' : 'Ver todas'}
                    </Button>
                </div>

                <div className='flex flex-col gap-5 mt-7'>
                    {incidents.map((incident) => (
                        <IncidentCard
                            key={incident.id}
                            id={incident.id}
                            title={incident.title}
                            description={incident.description}
                            status={incident.status}
                            imageUrl={incident.imageUrl}
                            authorAlias={incident.author?.alias || null}
                            createdAt={incident.createdAt}
                            editedAt={incident.editedAt}
                            isAdmin={isAdmin}
                            isOwner={incident.author?.alias !== null && incident.author.alias === (activeCommunity?.alias || null)}
                            onEdit={() => handleOpenEdit(incident)}
                            onDelete={() => setConfirmAction({ isOpen: true, type: 'delete', idToDelete: incident.id, title: 'Eliminar Incidencia', message: '¿Estás seguro de eliminar esta incidencia?' })}
                            onChangeStatus={() => setStatusModal({open: true, incidentId: incident.id, currentStatus: incident.status})}
                        />
                    ))}
                </div>

                {hasMore && (
                    <div className='text-center py-6'>
                        <Button variant="outline" onClick={handleLoadMore} disabled={loading}>
                            {loading ? 'Cargando...' : 'Cargar más incidencias'}
                        </Button>
                    </div>
                )}
                {!hasMore && incidents.length > 0 && <p className='text-center text-gray-400 text-sm py-6'>No hay más incidencias.</p>}
                {incidents.length === 0 && !loading && <p className='text-center text-gray-400 text-sm py-6'>No hay incidencias registradas.</p>}
            </main>

            <CreateEditIncidentModal
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                onSave={handleSaveIncident}
                isEditing={!!editingId}
                formData={formData}
                setFormData={setFormData}
            />

            <ChangeStatusModal
                isOpen={statusModal.open} 
                onClose={() => setStatusModal(prev => ({...prev, open: false}))}
                communityId={communityId!}
                incidentId={statusModal.incidentId}
                currentStatus={statusModal.currentStatus}
                onSuccess={() => {setPage(0); loadIncidents(0);}}
            />

            <FeedbackModal 
                isOpen={feedback.isOpen}
                type={feedback.type}
                message={feedback.message}
                onClose={closeFeedback}
            />

            <ConfirmModal
                isOpen={confirmAction.isOpen}
                onClose={() => setConfirmAction({...confirmAction, isOpen: false})}
                title={confirmAction.title}
                message={confirmAction.message}
                isDestructive={true}
                confirmText='Sí, eliminar'
                onConfirm={async () => {
                    if(confirmAction.type === 'delete') await handleDeleteIncident(confirmAction.idToDelete);
                }}
            />

        </div>
    );

};

export default IncidentPage;
