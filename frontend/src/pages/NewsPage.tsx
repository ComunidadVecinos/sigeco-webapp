import React, {useEffect, useState} from 'react';
import Header from '@/components/common/Header/Header';
import Sidebar from '@/components/ui/Sidebar/Sidebar';
import NewsCard from '@/components/ui/NewsCard/NewsCard';
import { Menu, Filter, Plus, Search } from 'lucide-react';
import { useAuth } from '@/context/authContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getNews, createNews, updateNews, deleteNews } from '@/services/newsService';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

interface News {
    id: number;
    title: string;
    content: string;
    createdAt: string;
}

const NewsPage: React.FC = () => {
    const {user} = useAuth();
    const communityId = user?.activeCommunityId;

    //Rol del usuario
    const activeCommunity: any = user?.communities?.find((c: any) => c.id === communityId);
    const isAdmin = activeCommunity?.role === 'PRESIDENT' || activeCommunity?.role === 'VICEPRESIDENT';

    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [newsList, setNewsList] = useState<News[]>([]);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [loading, setLoading] = useState(false);

    //Modal 
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingNewsId, setEditingNewsId] = useState<number | null>(null);
    const [formData, setFormData] = useState({title: '', content: ''});

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
                endDate: endDate || undefined
            });
            const fetchedNews = res.data.content || [];
            setNewsList(append ? [...newsList, ...fetchedNews] : fetchedNews);
            setHasMore(!res.data.last);
        } catch(err){
            console.error('Error cargando noticias', err);
        }
        setLoading(false);
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
        try{
            if(editingNewsId) {
                await updateNews(communityId, editingNewsId, formData);
            }else{
                await createNews(communityId, formData);
            }
            setIsFormOpen(false);
            setFormData({title: '', content: ''});
            setEditingNewsId(null);
            setPage(0);
            loadNews(0);
        } catch (err: any) {
            alert(err.response?.data?.error?.message || 'Error al guardar la noticia');
        }
    };

    const handleOpenCreate = () => {
        setFormData({title: '', content: ''});
        setEditingNewsId(null);
        setIsFormOpen(true);
    };

    const handleOpenEdit = (news: News) => {
        setFormData({title: news.title, content: news.content});
        setEditingNewsId(news.id);
        setIsFormOpen(true);
    };

    const handleDeleteNews = async (newsId: number) => {
        if(!communityId || !confirm('¿Estas seguro de eliminar esta noticia?')) return;
        try{
            await deleteNews(communityId, newsId);
            setNewsList(newsList.filter(n => n.id !== newsId));
        }
        catch (err: any) {
            alert(err.response?.data?.error?.message || 'Error al eliminar la noticia');
        }
    };


};

export default NewsPage;