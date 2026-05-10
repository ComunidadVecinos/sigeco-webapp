//Página de votaciones de la comunidad: listado paginado con filtro de estado, resumen (total/abiertas/cerradas), creación (admin), emisión de voto, cierre y eliminación
import React, {useEffect, useState} from 'react';
import Header from '@/components/common/Header/Header';
import Sidebar from '@/components/ui/Sidebar/Sidebar';
import VotingCard from '@/components/ui/VotingCard/VotingCard';
import CreateVotingModal from '@/components/ui/CreateVotingModal/CreateVotingModal';
import ConfirmCloseVotingModal from '@/components/ui/ConfirmCloseVotingModal/ConfirmCloseVotingModal';
import {Menu, Plus, Vote, CheckSquare, Lock} from 'lucide-react';
import { useAuth } from '@/context/authContext';
import { Button } from '@/components/ui/button';
import { getVotings, createVoting, voteOnVoting, closeVoting, deleteVoting } from '@/services/votingService';
import { businessFormToUtcIso } from '@/lib/businessDateTime';
import { getApiErrorMessage } from '@/lib/formErrors';
import { useNavigate } from 'react-router-dom';
import './VotingPage.css';
import FeedbackModal from '@/components/ui/FeedbackModal/FeedbackModal';
import ConfirmModal from '@/components/ui/ConfirmModal/ConfirmModal';

//Estructura de una votación: opciones, estado y resumen de contadores
interface VotingOption {
    id: string;
    title: string;
    votes: number;
}

interface Voting {
    id: string;
    title: string;
    description: string | null;
    creator: {alias: string | null};
    createdAt: string;
    startsAt: string;
    endsAt: string | null;
    status: 'OPEN' | 'CLOSED';
    totalVotes: number;
    possibleVoters: number;
    myVoteOptionId: string | null;
    options: VotingOption[];
}

interface VotingSummary {
    total: number;
    open: number;
    closed: number;
}

const VotingPage: React.FC = () => {
    const navigate = useNavigate();
    const {user, loading: authLoading} = useAuth();
    const communityId = user?.activeCommunityId;

    const activeCommunity: any = user?.communities?.find((c: any) => c.communityId === communityId);
    const isAdmin = activeCommunity?.role === 'PRESIDENT' || activeCommunity?.role === 'VICE_PRESIDENT';
    //Estado de la vista: sidebar, lisatdo de votaciones, resuemn, paginación, filtro de estado y modales
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [votingList, setVotingList] = useState<Voting[]>([]);
    const [summary, setSummary] = useState<VotingSummary>({total: 0, open: 0, closed: 0});
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'closed'>('all');
    const [loading, setLoading] = useState(false);
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [closeModalData, setCloseModalData] = useState<{id: string; title: string} | null>(null);
    //Feedback global y confirmación de eliminación
    const [feedback, setFeedback] = useState<{isOpen: boolean, type: 'success' | 'error', message: string}>({isOpen: false, type: 'success', message: ''});
    const closeFeedback = () => setFeedback(prev => ({...prev, isOpen: false}));
    const [confirmAction, setConfirmAction] = useState<{isOpen: boolean; type: 'deletingVoting' | null; votingId: string; title: string; message: string;}>({isOpen: false, type: null, votingId: '', title: '', message: ''});

    //Redirige al perfil si el usuario no tiene comunidad activa
    useEffect(() => {
        if(!authLoading && user && !communityId){
            navigate('auth/me', {replace: true});
        }
    }, [authLoading, communityId, navigate, user]);

    //Carga las votaciones paginadas con filtro de estado opcional y actualiza el resumen
    const loadVotings = async (pageNum: number, append: boolean = false) => {
        if(!communityId) return;
        setLoading(true);
        try{
            const res: any = await getVotings(communityId, {page: pageNum, pageSize: 8, status: statusFilter === 'all' ? undefined: statusFilter});
            const fetchedVotings = res.data.items || [];
            if(append){
                setVotingList(prev => [...prev, ...fetchedVotings]);
            }
            else{
                setVotingList(fetchedVotings);
            }

            const pagination = res.data.pagination;
            setHasMore(pagination && pagination.page < pagination.totalPages);
            setSummary(res.data.summary || {total: 0, open: 0, closed: 0});
        }catch (err: any){
            if(err.response?.status === 404){
                setVotingList([]);
                setHasMore(false);
            }
        } finally{
            setLoading(false);
        }
    };

    //Recarga las votaciones desde la página 1 cuando cambia el filtro o la comunidad
    useEffect(() => {
        setPage(1);
        loadVotings(1, false);
    }, [communityId, statusFilter]);

    //Carga la siguiente página de votaciones y las añade al listado existente
    const handleLoadMore = () => {
        const nextPage = page + 1;
        setPage(nextPage);
        loadVotings(nextPage, true);
    };

    //Crear votacion
    const handleCreateVoting = async (data: {title: string; description: string; endsAtDate: string; endsAtTime: string; options: string[]}) => {
        if(!communityId) return;
        try{
            const endsAt = businessFormToUtcIso(data.endsAtDate, data.endsAtTime);
            if(!endsAt) {setFeedback({isOpen: true, type: 'error', message: 'Fecha y hora de cierre no válidas'}); return;}
            await createVoting(communityId, {title: data.title, description: data.description || undefined, endsAt, options: data.options.map(o => ({title: o}))});
            setCreateModalOpen(false);
            setPage(1);
            loadVotings(1, false);
        } catch (err: any) {
            setFeedback({isOpen: true, type: 'error', message: getApiErrorMessage(err, 'Error al crear la votación')});
        }
    };

    //Emitir voto
    const handleVote = async (votingId: string, optionId: string) => {
        if(!communityId) return;
        try{
            await voteOnVoting(communityId, votingId, {optionId});
            setPage(1);
            loadVotings(1, false);
        } catch (err: any){
            setFeedback({isOpen: true, type: 'error', message: getApiErrorMessage(err, 'Error al emitir el voto')});
        }
    };

    //Cerrar votacion
    const handleCloseVoting = async () => {
        if(!communityId || !closeModalData) return;
        try{
            await closeVoting(communityId, closeModalData.id);
            setCloseModalData(null);
            setPage(1);
            loadVotings(1, false);
        } catch (err: any){
            setFeedback({isOpen: true, type: 'error', message: getApiErrorMessage(err, 'Error al cerrar la votación')});
        }
    };

    //Eliminar votacion
    const handleDeleteVoting = async (votingId: string) => {
        if(!communityId) return;
        try{
            await deleteVoting(communityId, votingId);
            setPage(1);
            loadVotings(1, false);
        } catch (err: any){
            setFeedback({isOpen: true, type: 'error', message: getApiErrorMessage(err, 'Error al eliminar la votación')});
        }
    };

    if(authLoading) return null;

    return (
        <div>
            <Header
                showCommunutySwitcher={true}
                navLinks={[
                    { label: <><Menu className="h-4 w-4 inline mr-1" /> Comunidad</>, path: "#", onClick: () => setSidebarOpen(true) },
                    { label: "Calendario", path: "/calendar" },
                    { label: "Ayuda", path: "/help" }
                ]}
            />
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <main className='max-w-[700px] mx-auto pt-[250px] md:pt-[200px] px-4 md:px-0'>
                <h1 className='text-[28px] font-bold mb-7 text-center'>Votaciones</h1>

                {/*Barra de acciones: botón de crear votación (solo admin) y filtro de estado*/}
                <div className='flex justify-between items-center mb-4'>
                    {isAdmin ? (
                        <Button onClick={() => setCreateModalOpen(true)} size="sm" className='flex items-center gap-2'>
                            <Plus className='h-4 w-4' /> Nueva votación
                        </Button>
                    ) : <div></div> }

                    <div className='flex gap-2 bg-gray-50 p-1 rounded-lg border border-gray-100'>
                        <Button variant={statusFilter === 'all' ? 'default' : 'ghost'} size="sm" onClick={() => setStatusFilter('all')} className={statusFilter === 'all' ? 'shadow-sm' : ''}>Todas</Button>
                        <Button variant={statusFilter === 'open' ? 'default' : 'ghost'} size="sm" onClick={() => setStatusFilter('open')} className={statusFilter === 'open' ? 'shadow-sm' : ''}>Abiertas</Button>
                        <Button variant={statusFilter === 'closed' ? 'default' : 'ghost'} size="sm" onClick={() => setStatusFilter('closed')} className={statusFilter === 'closed' ? 'shadow-sm' : ''}>Cerradas</Button>
                    </div>
                </div>

                {/*Tarjetas de resumen: total, abiertas y cerradas*/}
                <div className='grid grid-cols-3 gap-3 mb-6'>
                    <div className='bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center'>
                        <Vote className='h-5 w-5 mx-auto text-blue-500 mb-1' />
                        <p className='text-2xl font-bold text-gray-900'>{summary.total}</p>
                        <p className='text.xs text-gray-500'>Total</p>
                    </div>
                    <div className='bg-white rounded-xl p-4 shadow-sm border border-emerald-100 text-center'>
                        <CheckSquare className='h-5 w-5 mx-auto text-emerald-500 mb-1' />
                        <p className='text-2xl font-bold text-emerald-700'>{summary.open}</p>
                        <p className='text-xs text-gray-500'>Abiertas</p>
                    </div>
                    <div className='bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center'>
                        <Lock className='h-5 w-5 mx-auto text-gray-500 mb-1' />
                        <p className='text-2xl font-bold text-gary-700'>{summary.closed}</p>
                        <p className='text-xs text-gray-500'>Cerradas</p>
                    </div>
                </div>

                {/*Listado de votaciones con VotingCard*/}
                {
                    <div className='flex flex-col gap-5 mt-7'>
                        {loading && votingList.length === 0 ? (
                            <div className='text-center py-6'>
                                <p className='text-gray-400 text-sm'>Cargando votaciones...</p>
                            </div>
                        ) : (votingList.length === 0) ? (
                            <div className='text-center py-12 bg-white rounded-2xl border border-gray-100 shadow-sm'>
                                <Vote className='h-12 w-12 mx-auto text-gray-300 mb-3' />
                                <p className='text-gray-400 font-medium text-sm'>No hay votaciones {statusFilter !== 'all' ? (statusFilter === 'open' ? 'abiertas' : 'cerradas') : ''} todavía</p>
                                {isAdmin && statusFilter === 'all' && (
                                    <p className='text-xs text-gray-400 mt-1'>Crea la primera votación para tu comunidad</p>
                                )}
                            </div>
                        ) : (
                            votingList.map((voting) => (
                                <VotingCard
                                    key={voting.id}
                                    id = {voting.id}
                                    title = {voting.title}
                                    description= {voting.description}
                                    creatorAlias={voting.creator?.alias}
                                    createdAt={voting.createdAt}
                                    endsAt={voting.endsAt}
                                    status={voting.status}
                                    totalVotes={voting.totalVotes}
                                    possibleVoters={voting.possibleVoters}
                                    myVoteOptionId={voting.myVoteOptionId}
                                    options={voting.options}
                                    isAdmin={isAdmin}
                                    onVote={handleVote}
                                    onClose={(id) => setCloseModalData({id, title: voting.title})}
                                    onDelete={(id) => setConfirmAction({isOpen: true, type: 'deletingVoting', votingId: id, title: 'Eliminar Votación', message: '¿Estás seguro de que quieres eliminar esta votación?'})}
                                />
                            ))
                        )}
                    </div>
                }

                {/*Paginación y mensaje de fin de lista*/}
                {hasMore && (
                    <div className='text-center py-6'>
                        <Button variant="outline" onClick={handleLoadMore} disabled={loading}>
                            {loading ? 'Cargando...' : 'Cargar más votaciones'}
                        </Button>
                    </div>
                )}
                {!hasMore && votingList.length > 0 && (
                    <p className='text-center text-gray-400 text-sm py-6'>No hay más votaciones.</p>
                )}
            </main>

            {/*Modales: crear votación, confirmar cierre, feedback y confirmación de eliminación*/}
            <CreateVotingModal
                isOpen={createModalOpen}
                onClose={() => setCreateModalOpen(false)}
                onSave={handleCreateVoting}
            />

            {closeModalData && (
                <ConfirmCloseVotingModal
                    isOpen={true}
                    onClose={() => setCloseModalData(null)}
                    onConfirm={handleCloseVoting}
                    votingTitle={closeModalData.title}
                />
            )}

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
                onConfirm={async () => {
                    if(confirmAction.type === 'deletingVoting') await handleDeleteVoting(confirmAction.votingId);
                }}
            />
        </div>
    );
};

export default VotingPage;