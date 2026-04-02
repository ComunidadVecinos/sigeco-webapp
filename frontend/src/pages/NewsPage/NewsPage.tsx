import React, {useEffect, useState} from 'react';
import Header from '@/components/common/Header/Header';
import Sidebar from '@/components/ui/Sidebar/Sidebar';
import NewsCard from '@/components/ui/NewsCard/NewsCard';
import CreateEditNewsModal from '@/components/ui/CreateEditNewsModal/CreateEditNewsModal';
import { Menu, Filter, Plus, Search } from 'lucide-react';
import { useAuth } from '@/context/authContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getNews, createNews, updateNews, deleteNews } from '@/services/newsService';
import { useNavigate } from 'react-router-dom';

interface News {
    id: number;
    title: string;
    content: string;
    createdAt: string;
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

    //Rol del usuario
    const activeCommunity: any = user?.communities?.find((c: any) => c.communityId === communityId);
    const isAdmin = activeCommunity?.role === 'PRESIDENT' || activeCommunity?.role === 'VICE_PRESIDENT';

    
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [newsList, setNewsList] = useState<News[]>([]);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [loading, setLoading] = useState(false);
    const [featureUnavailable, setFeatureUnavailable] = useState(false);

    //Modal de crear/editar
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingNewsId, setEditingNewsId] = useState<number | null>(null);
    const [formData, setFormData] = useState({title: '', content: '', isEvent: false, eventStartDate: '', eventStartTime: '', eventEndDate: '', eventEndTime: '', imageFile: null as File | null, imagePreview: ''});

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
            setFeatureUnavailable(false);
            const res: any = await getNews(communityId, {
                page: pageNum,
                pageSize: 10,
                search: searchQuery || undefined,
                startDate: startDate || undefined,
                endDate: endDate || undefined
            });
            const fetchedNews = res.data.content || [];
            setNewsList(append ? [...newsList, ...fetchedNews] : fetchedNews);
            setHasMore(!res.data.last);
        } catch(err: any){
            if(err?.response?.status === 404){
                setFeatureUnavailable(true);
                setNewsList([]);
                setHasMore(false);
            }
            console.error('Error cargando noticias', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {setPage(0); loadNews(0);}, [communityId, searchQuery, startDate, endDate]);

    const handleLoadMore = () => {
        const nextPage = page + 1;
        setPage(nextPage);
        loadNews(nextPage, true);
    }

    //Guardar noticia
    const handleSaveNews = async () => {
        if(!communityId || !formData.title.trim() || !formData.content.trim()) return;
        if(featureUnavailable) return;
        try{
            if(editingNewsId) {
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
            alert(err.response?.data?.error?.message || 'Error al guardar la noticia');
        }
    };

    const handleOpenCreate = () => {
        setFormData({title: '', content: '', isEvent: false, eventStartDate: '', eventStartTime: '', eventEndDate: '', eventEndTime: '', imageFile: null as File | null, imagePreview: ''});
        setEditingNewsId(null);
        setIsFormOpen(true);
    };

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

    const handleDeleteNews = async (newsId: number) => {
        if(!communityId || !confirm('¿Estas seguro de eliminar esta noticia?')) return;
        if(featureUnavailable) return;
        try{
            await deleteNews(communityId, newsId);
            setNewsList(newsList.filter(n => n.id !== newsId));
        }
        catch (err: any) {
            alert(err.response?.data?.error?.message || 'Error al eliminar la noticia');
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

                {featureUnavailable && (
                    <div className='bg-white rounded-2xl border border-amber-200 p-6 mb-6 text-amber-800 shadow-sm'>
                        El backend actual no expone todavía el módulo de noticias. La pantalla se mantiene accesible, pero sus datos y acciones no están disponibles en esta arquitectura.
                    </div>
                )}

                <div className="flex justify-between items-center mb-4">
                    {isAdmin ? (
                        <Button onClick={handleOpenCreate} size="sm" className='flex items-center gap-2' disabled={featureUnavailable}>
                            <Plus className='h-4 w-4'/> Redactar Comunicado
                        </Button>
                    ) : <div></div> }

                    <Button variant={(startDate || endDate || searchQuery) ? 'default' : 'outline'} size="sm" onClick={() => setShowAdvancedFilters(!showAdvancedFilters)} className='flex items-center gap-2'>
                        <Filter className='h-4 w-4' /> Filtros {(startDate || endDate || searchQuery) && "(Activos)"}
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
                            {(startDate || endDate || searchQuery) ? (
                                <Button variant="ghost" size="sm" className='text-red-500 hover:text-red-600 hover:bg-red-50' onClick={() => {setStartDate(''); setEndDate(''); setSearchQuery(''); }}>Limpiar filtros</Button>
                            ) : <div></div> }
                            <Button variant="outline" size="sm" onClick={() => 
                                setShowAdvancedFilters(false)}>Ocultar
                            </Button>
                        </div>
                    </div>
                )}

                <div className='flex flex-col gap-5 mt-7'>
                    {newsList.map((news) => (
                        <NewsCard
                            key={news.id}
                            id={news.id}
                            title={news.title}
                            content={news.content}
                            createdAt={news.createdAt}
                            imageUrl={news.imageUrl}
                            isAdmin={isAdmin}
                            onEdit={() => handleOpenEdit(news)}
                            onDelete={() => handleDeleteNews(news.id)}
                        />
                    ))}
                </div>

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

            <CreateEditNewsModal
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                onSave={handleSaveNews}
                isEditing={!!editingNewsId}
                formData={formData}
                setFormData={setFormData}
            />
        </div>
    );

};

export default NewsPage;
