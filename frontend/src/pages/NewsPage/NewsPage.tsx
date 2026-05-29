//Página del tablón de noticias: listado paginado con filtros, creación/edición/eliminación (solo admins)
import React, {useEffect, useState} from 'react';
import Header from '@/components/common/Header/Header';
import Sidebar from '@/components/ui/Sidebar/Sidebar';
import NewsCard from '@/components/ui/NewsCard/NewsCard';
import CreateEditNewsModal from '@/components/ui/CreateEditNewsModal/CreateEditNewsModal';
import { Menu, Filter, Plus, Search } from 'lucide-react';
import { useAuth } from '@/context/authContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getNews, createNews, updateNews, deleteNews, deleteNewsImage } from '@/services/newsService';
import { useNavigate } from 'react-router-dom';
import FeedbackModal from '@/components/ui/FeedbackModal/FeedbackModal';
import ConfirmModal from '@/components/ui/ConfirmModal/ConfirmModal';
import { getApiErrorMessage } from '@/lib/formErrors';

//Estructura de una noticia del tablón
interface News {
    id: string;
    title: string;
    content: string;
    createdAt: string;
    editedAt?: string | null;
    authorAlias?: string | null;
    isEvent?: boolean;
    eventStartDate?: string;
    eventStartTime?: string;
    eventEndDate?: string;
    eventEndTime?: string;
    imageUrl?: string;
}

const NewsPage: React.FC = () => {
    const navigate = useNavigate();
    const {user, loading: authLoading} = useAuth();
    const communityId = user?.activeCommunityId;

    //Determina el rol del usuario en la comunidad activa para controlar acciones de admin
    const activeCommunity: any = user?.communities?.find((c: any) => c.communityId === communityId);
    const isAdmin = activeCommunity?.role === 'PRESIDENT' || activeCommunity?.role === 'VICE_PRESIDENT';

    //Estado de la vista: sidebar, listado de noticias, paginación, búsqueda y filtros
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [newsList, setNewsList] = useState<News[]>([]);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [loading, setLoading] = useState(false);
    //Estado del modal de crear/editar: visibilidad, ID de edición y datos del formulario
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingNewsId, setEditingNewsId] = useState<string | null>(null);
    const [formData, setFormData] = useState({title: '', content: '', isEvent: false, eventStartDate: '', eventStartTime: '', eventEndDate: '', eventEndTime: '', imageFile: null as File | null, imagePreview: ''});
    //Filtro por tipo de noticia
    const [eventTypeFilter, setEventTypeFilter] = useState<'all' | 'event' | 'nonEvent'>('all');
    //Modales de feedback y confirmaciñon de eliminación
    const [feedback, setFeedback] = useState<{isOpen: boolean, type: 'success' | 'error', message: string}>({isOpen: false, type: 'success', message: ''});
    const [confirmAction, setConfirmAction] = useState<{isOpen: boolean; type: 'delete' | null; idToDelete: string; title: string; message: string;}>({isOpen: false, type: null, idToDelete: '', title: '', message: ''});

    const closeFeedback = () => setFeedback(prev => ({...prev, isOpen: false}));    
    
    //Redirige al perfil si el usuario no tiene comunidad activa
    useEffect(() => {
        if (!authLoading && user && !communityId) {
            navigate('/auth/me', { replace: true });
        }
    }, [authLoading, communityId, navigate, user]);
    

    //Cargar noticias
    const loadNews = async (pageNum: number, append: boolean = false) => {
        if(!communityId) return;
        setLoading(true);
        try{
            const res: any = await getNews(communityId, {
                page: pageNum,
                pageSize: 10,
                search: searchQuery || undefined,
                startDate: startDate || undefined,
                endDate: endDate || undefined,
                eventType: eventTypeFilter
            });
            const fetchedNews = res.data.content || [];
            setNewsList(append ? [...newsList, ...fetchedNews] : fetchedNews);
            setHasMore(!res.data.last);
        } catch(err: any){
            if(err?.response?.status === 404){
                setNewsList([]);
                setHasMore(false);
            }
            console.error('Error cargando noticias', err);
        } finally {
            setLoading(false);
        }
    };

    //Recargar las noticias desde la página 0 cuando cambian los filtros o la comunidad
    useEffect(() => {setPage(0); loadNews(0);}, [communityId, searchQuery, startDate, endDate, eventTypeFilter]);

    //Carga la siguiente página de noticias y las añade al listado existente
    const handleLoadMore = () => {
        const nextPage = page + 1;
        setPage(nextPage);
        loadNews(nextPage, true);
    }

    //Guardar noticia
    const handleSaveNews = async () => {
        if(!communityId || !formData.title.trim() || !formData.content.trim()) return;
        try{
            if(editingNewsId) {
                const originalNews = newsList.find(n => n.id === editingNewsId);
                if(originalNews?.imageUrl && !formData.imagePreview && !formData.imageFile){
                    await deleteNewsImage(communityId, editingNewsId);
                }
                await updateNews(communityId, editingNewsId, formData);
            }else{
                await createNews(communityId, formData);
            }
            setIsFormOpen(false);
            setFormData({title: '', content: '', isEvent: false, eventStartDate: '', eventStartTime: '', eventEndDate: '', eventEndTime: '', imageFile: null as File | null, imagePreview: ''});
            setEditingNewsId(null);
            setPage(0);
            loadNews(0);
        } catch (err: any) {
            setFeedback({isOpen: true, type: 'error', message: getApiErrorMessage(err, 'Error al guardar la noticia.')});
        }
    };

    //Abre el modal en modo creación con el formulario vacío
    const handleOpenCreate = () => {
        setFormData({title: '', content: '', isEvent: false, eventStartDate: '', eventStartTime: '', eventEndDate: '', eventEndTime: '', imageFile: null as File | null, imagePreview: ''});
        setEditingNewsId(null);
        setIsFormOpen(true);
    };

    //Abre el modal en modo edición con los datos de la noticia seleccionada
    const handleOpenEdit = (news: News) => {
        setFormData({
            title: news.title,
            content: news.content,
            isEvent: news.isEvent || false,
            eventStartDate: news.eventStartDate || '',
            eventStartTime: news.eventStartTime || '',
            eventEndDate: news.eventEndDate || '',
            eventEndTime: news.eventEndTime || '',
            imageFile: null,
            imagePreview: news.imageUrl || ''
        });
        setEditingNewsId(news.id);
        setIsFormOpen(true);
    };

    //Elimina una noticia y la quita del listado 
    const handleDeleteNews = async (newsId: string) => {
        if(!communityId) return;
        try{
            await deleteNews(communityId, newsId);
            setNewsList(newsList.filter(n => n.id !== newsId));
        }
        catch (err: any) {
            setFeedback({isOpen: true, type: 'error', message: getApiErrorMessage(err, 'Error al eliminar la noticia.')});
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
                <h1 className='text-[28px] font-bold mb-7 text-center'>Tablón de noticias</h1>
                {/*Barra de acciones: botón para redactar y toggle de filtros*/}
                <div className="flex justify-between items-center mb-4">
                    {isAdmin ? (
                        <Button onClick={handleOpenCreate} size="sm" className='flex items-center gap-2'>
                            <Plus className='h-4 w-4'/> Redactar Comunicado
                        </Button>
                    ) : <div></div> }

                    <Button variant={(startDate || endDate || searchQuery ||eventTypeFilter !== 'all') ? 'default' : 'outline'} size="sm" onClick={() => setShowAdvancedFilters(!showAdvancedFilters)} className='flex items-center gap-2'>
                        <Filter className='h-4 w-4' /> Filtros {(startDate || endDate || searchQuery || eventTypeFilter !== 'all') && "(Activos)"}
                    </Button>
                </div>

                {/*Panel de filtros*/}
                {showAdvancedFilters && (
                    <div className='bg-white rounded-2xl border border-gray-200 p-6 mb-6 shadow-sm'>
                        <div className='flex flex-col md:flex-row gap-6'>
                            <div className='flex-1 md:max-w-[200px]'>
                                <label className='block text-sm font-bold text-gray-900 mb-3 border-b border-gray-100 pb-2'>Palabra clave</label>
                                <div className='relative mt-4'>
                                    <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400'/>
                                    <Input
                                        className='pl-9 text-sm'
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                                <div className='flex-1 border-t md:border-t-0 md:border-l border-gray-200 pt-5 md:pt-0 md:pl-8'>
                                    <label className='block text-sm font-bold text-gray-900 mb-3 border-b border-gray-100 pb-2'>Tipo de noticia</label>
                                    <div className='flex flex-col gap-2 mt-4'>
                                        <Button variant={eventTypeFilter === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setEventTypeFilter('all')}>
                                            Todas
                                        </Button>
                                        <Button variant={eventTypeFilter === 'event' ? 'default' : 'outline'} size="sm" onClick={() => setEventTypeFilter('event')}>
                                            Solo eventos
                                        </Button>
                                        <Button variant={eventTypeFilter === 'nonEvent' ? 'default' : 'outline'} size="sm" onClick={() => setEventTypeFilter('nonEvent')}>
                                            Sin eventos
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            <div className='flex-1 border-t md:border-t-0 md:border-l border-gray-200 pt-5 md:pt-0 md:pl-8'>
                                <label className='block text-sm font-bold text-gray-900 mb-3 border-b border-gray-100 pb-2'>Fecha de publicación</label>
                                <div className='flex flex-col sm:flex-row items-start sm:items-center gap-4 mt-4'>
                                    <div className='flex flex-col w-full sm:w-auto'>
                                        <span className='text-xs font-medium text-gray-500 mb-1 ml-1'>Desde:</span>
                                        <Input
                                            type='date'
                                            className='bg-gray-50 cursor-pointer text-sm'
                                            value={startDate}
                                            onChange={(e) => setStartDate(e.target.value)}
                                        />
                                    </div>
                                    <span className='hidden sm:block text-gray-400 mt-5'>→</span>
                                    <div className='flex flex-col w-full sm:w-auto'>
                                        <span className='text-xs font-medium text-gray-500 mb-1 ml-1'>Hasta:</span>
                                        <Input
                                            type='date'
                                        className='bg-gray-50 cursor-pointer text-sm'
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className='mt-6 pt-4 flex justify-between items-center border-t border-gray-100'>
                            {(startDate || endDate || searchQuery || eventTypeFilter !== 'all') ? (
                                <Button variant="ghost" size="sm" className='text-red-500 hover:text-red-600 hover:bg-red-50' onClick={() => {setStartDate(''); setEndDate(''); setSearchQuery(''); setEventTypeFilter('all')}}>Limpiar filtros</Button>
                            ) : <div></div> }
                            <Button variant="outline" size="sm" onClick={() => 
                                setShowAdvancedFilters(false)}>Ocultar
                            </Button>
                        </div>
                    </div>
                )}

                {/*Listado de noticias con NewsCard*/}
                <div className='flex flex-col gap-5 mt-7'>
                    {newsList.map((news) => (
                        <NewsCard
                            key={news.id}
                            id={news.id}
                            title={news.title}
                            content={news.content}
                            createdAt={news.createdAt}
                            editedAt={news.editedAt}
                            authorAlias={news.authorAlias}
                            imageUrl={news.imageUrl}
                            isAdmin={isAdmin}
                            onEdit={() => handleOpenEdit(news)}
                            onDelete={() => setConfirmAction({ isOpen: true, type: 'delete', idToDelete: news.id, title: 'Eliminar Noticia', message: '¿Estás seguro de eliminar esta noticia?' })}
                            isEvent={news.isEvent}
                            eventStartDate={news.eventStartDate}
                            eventEndDate={news.eventEndDate}
                            eventStartTime={news.eventStartTime}
                            eventEndTime={news.eventEndTime}
                        />
                    ))}
                </div>

                {/*Paginación: botón de carga mas y mensajes de fin de lista*/}
                {hasMore && (
                    <div className='text-center py-6'>
                        <Button variant="outline" onClick={handleLoadMore} disabled={loading}>
                            {loading ? 'Cargando...' : 'Cargar más noticias'}
                        </Button>
                    </div>
                )}
                {!hasMore && newsList.length > 0 && <p className='text-center text-gray-400 text-sm py-6'>No hay más noticias.</p>}
                {newsList.length === 0 && !loading && <p className='text-center text-gray-400 text-sm py-6'>No hay comunicados publicados.</p>}
            </main>

            {/*Modales: crear/editar noticia, feedback y configuración*/}
            <CreateEditNewsModal
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                onSave={handleSaveNews}
                isEditing={!!editingNewsId}
                formData={formData}
                setFormData={setFormData}
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
                    if(confirmAction.type === 'delete') await handleDeleteNews(confirmAction.idToDelete);
                }}
            />
        </div>
    );

};

export default NewsPage;
