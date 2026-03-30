import React, { useEffect, useState } from 'react';
import Header from '../../components/common/Header/Header';
import Sidebar from '../../components/ui/Sidebar/Sidebar';
import CreatePost from '../../components/ui/CreatePost/CreatePost';
import PostCard from '../../components/ui/PostCard/PostCard';
import CommentsModal from '../../components/ui/CommentsModal/CommentsModal';
import { Menu, Filter, CalendarIcon } from 'lucide-react';
import { useAuth } from '@/context/authContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getPosts, createPost, updatePost, deletePost, toggleLike, getComments, addComment, updateComment, deleteComment, votePoll } from '@/services/forumService';
import {format} from "date-fns";
import { es } from 'date-fns/locale';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DateRange } from 'react-day-picker';
import { useNavigate } from 'react-router-dom';


type PostCategory = 'pregunta' | 'encuesta' | 'anuncio' | 'solicitud';

interface Comment {
    id: number;
    authorName: string;
    authorAvatar?: string;
    content: string;
    timestamp: string;
    isOwner?: boolean;
}

interface Post {
    id: number;
    authorName: string;
    authorAvatar?: string;
    content: string;
    timestamp: string;
    category: PostCategory;
    likes: number;
    views: number;
    commentCount: number;
    pollOptions?: { text: string; votes: number }[];
    hasLiked: boolean;
    hasVoted: number | null;
    isOwner: boolean;
}


const ForumPage: React.FC = () => {
    const navigate = useNavigate();
    const { user, loading: authLoading } = useAuth();
    const communityId = user?.activeCommunityId;

    //Rol del usuario
    const activeCommunity: any = user?.communities?.find((c: any) => c.communityId === communityId);
    const isAdmin = activeCommunity?.role === 'PRESIDENT' || activeCommunity?.role === 'VICE_PRESIDENT';

    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [posts, setPosts] = useState<Post[]>([]);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [categoryFilter, setCategoryFilter] = useState('');
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [loading, setLoading] = useState(false);
    const [featureUnavailable, setFeatureUnavailable] = useState(false);

    //Comentarios
    const [selectedPost, setSelectedPost] = useState<Post | null>(null);
    const [commentsList, setCommentsList] = useState<Comment[]>([]);

    //Editar post
    const [editingPostId, setEditingPostId] = useState<number | null>(null);
    const [editPostContent, setEditPostContent] = useState('');

    useEffect(() => {
        if (!authLoading && user && !communityId) {
            navigate('/auth/me', { replace: true });
        }
    }, [authLoading, communityId, navigate, user]);

    //Cargar posts
    const loadPosts = async (pageNum: number, append: boolean = false) => {
        if (!communityId) return;
        setLoading(true);
        try {
            setFeatureUnavailable(false);
            const res = await getPosts(communityId, { page: pageNum, pageSize: 10, category: categoryFilter || undefined, startDate: startDate || undefined, endDate: endDate || undefined });
            const newPosts = res.data.content || [];
            setPosts(append ? [...posts, ...newPosts] : newPosts);
            setHasMore(!res.data.last);
        } catch (err: any) {
            if(err?.response?.status === 404){
                setFeatureUnavailable(true);
                setPosts([]);
                setHasMore(false);
            }
            console.error('Error cargando posts', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {setPage(0); loadPosts(0); }, [communityId, categoryFilter, startDate, endDate]);

    const handleLoadMore = () => {
        const nextPage = page + 1;
        setPage(nextPage);
        loadPosts(nextPage, true);
    }

    //Crear post
    const handleNewPost = async (content: string, category: PostCategory, pollOptions?: string[]) => {
        if (!communityId) return;
        if (featureUnavailable) return;
        try {
            await createPost(communityId, { content, category, pollOptions });
            setPage(0);
            loadPosts(0);
        }
        catch (err: any) {
            alert(err.response?.data?.error?.message || 'Error al crear publicaciópn');
        }
    };

    //Editar post
    const handleEditPost = async (postId: number) => {
        if (!communityId || !editPostContent.trim()) return;
        if (featureUnavailable) return;
        try {
            await updatePost(communityId, postId, { content: editPostContent });
            setPosts(posts.map(p => p.id === postId ? { ...p, content: editPostContent } : p));
            setEditingPostId(null);
            setEditPostContent('');
        } catch (err: any) {
            alert(err.response?.data?.error?.message || 'Error al editar publicación');
        }
    };

    //Eliminar post
    const handleDeletePost = async (postId: number) => {
        if (!communityId || !confirm('¿Eliminar esta publicación?')) return;
        if (featureUnavailable) return;
        try {
            await deletePost(communityId, postId);
            setPosts(posts.filter(p => p.id !== postId));
        } catch (err: any) {
            alert(err.response?.data?.error?.message || 'Error al eliminar publicación');
        }
    };

    //Dar o quitar like
    const handleLike = async (postId: number) => {
        if (!communityId) return;
        if (featureUnavailable) return;
        try {
            const res = await toggleLike(communityId, postId);
            setPosts(posts.map(p => p.id === postId ? {
                ...p,
                hasLiked: res.data.liked,
                likes: res.data.liked ? p.likes + 1 : p.likes - 1
            } : p));
        } catch (err: any) {
            console.error('Error al dar like', err);
        }
    };

    // Votar encuesta
    const handleVote = async (postId: number, optionIndex: number) => {
        if (!communityId) return;
        if (featureUnavailable) return;
        try {
            await votePoll(communityId, postId, { optionIndex });
            setPosts(posts.map(p => {
                if (p.id !== postId || !p.pollOptions) return p;
                const newOptions = p.pollOptions.map((opt, i) =>
                    i === optionIndex ? { ...opt, votes: opt.votes + 1 } : opt
                );
                return { ...p, hasVoted: optionIndex, pollOptions: newOptions };
            }));
        } catch (err: any) {
            alert(err.response?.data?.error?.message || 'Error al votar');
        }
    };

    //Cargar comentarios
    const handleOpenComments = async (post: Post) => {
        setSelectedPost(post);
        if (!communityId) return;
        if (featureUnavailable) return;
        try {
            const res = await getComments(communityId, post.id, { page: 0, pageSize: 50 });
            setCommentsList(res.data.content || []);
        } catch (err) {
            console.error('Error cargando comentarios', err);
            setCommentsList([]);
        }
    };

    // Añadir comentario
    const handleAddComment = async (content: string) => {
        if (!communityId || !selectedPost) return;
        if (featureUnavailable) return;
        try {
            const res = await addComment(communityId, selectedPost.id, { content });
            setCommentsList([...commentsList, res.data]);
            setPosts(posts.map(p => p.id === selectedPost.id ? { ...p, commentCount: p.commentCount + 1 } : p));
        } catch (err: any) {
            alert(err.response?.data?.error?.message || 'Error al comentar');
        }
    };

    // Editar comentario
    const handleEditComment = async (commentId: number, content: string) => {
        if (!communityId || !selectedPost) return;
        if (featureUnavailable) return;
        try {
            await updateComment(communityId, selectedPost.id, commentId, { content });
            setCommentsList(commentsList.map(c => c.id === commentId ? { ...c, content } : c));
        } catch (err: any) {
            alert(err.response?.data?.error?.message || 'Error al editar comentario');
        }
    };

    // Eliminar comentario
    const handleDeleteComment = async (commentId: number) => {
        if (!communityId || !selectedPost || !confirm('¿Eliminar este comentario?')) return;
        if (featureUnavailable) return;
        try {
            await deleteComment(communityId, selectedPost.id, commentId);
            setCommentsList(commentsList.filter(c => c.id !== commentId));
            setPosts(posts.map(p => p.id === selectedPost.id ? { ...p, commentCount: p.commentCount - 1 } : p));
        } catch (err: any) {
            alert(err.response?.data?.error?.message || 'Error al eliminar comentario');
        }
    };

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

            <main className='max-w-[700px] mx-auto pt-[250px] md:pt-[200px]'>
                <h1 className='text-[28px] font-bold mb-7 text-center'>Foro comunitario</h1>

                {featureUnavailable && (
                    <div className='bg-white rounded-2xl border border-amber-200 p-6 mb-6 text-amber-800 shadow-sm'>
                        El backend actual no expone todavía el módulo de foro. La pantalla se mantiene accesible, pero sus datos y acciones no están disponibles en esta arquitectura.
                    </div>
                )}

                <div className='flex justify-end mb-4'>
                    <Button variant={(categoryFilter || startDate || endDate) ? 'default' : 'outline'} size="sm" onClick={() => setShowAdvancedFilters(!showAdvancedFilters)} className='flex items-center gap-2'>
                        <Filter className='h-4 w-4' />
                        Filtros {(categoryFilter || startDate || endDate) && "(Activos)"}
                    </Button>
                </div>

                {showAdvancedFilters && (
                    <div className='bg-white rounded-2xl border border-gray-200 p-6 mb-6 shadow-sm'>
                        <div className='flex flex-col md:flex-row gap-6'>
                            {/*Filtro por categoria */}
                            <div className='flex-1 md:max-w-[200px]'>
                                <label className='block text-sm font-bold text-gray-900 mb-3 border-b border-gray-100 pb-2'>Categoría</label>
                                <div className='flex flex-col gap-2'>
                                    <Button variant={categoryFilter === '' ? 'default' : 'outline'} size="sm" onClick={() => setCategoryFilter('')}>Todos</Button>
                                    <Button variant={categoryFilter === 'pregunta' ? 'default' : 'outline'} size="sm" onClick={() => setCategoryFilter('pregunta')}>❓ Preguntas</Button>
                                    <Button variant={categoryFilter === 'encuesta' ? 'default' : 'outline'} size="sm" onClick={() => setCategoryFilter('encuesta')}>📊 Encuestas</Button>
                                    <Button variant={categoryFilter === 'anuncio' ? 'default' : 'outline'} size="sm" onClick={() => setCategoryFilter('anuncio')}>📢 Anuncios</Button>
                                    <Button variant={categoryFilter === 'solicitud' ? 'default' : 'outline'} size="sm" onClick={() => setCategoryFilter('solicitud')}>🙋 Solicitudes</Button>
                                </div>
                            </div>

                            <div className='flex-1 border-t md:border-t-0 md:border-l border-gray-200 pt-5 md:pt-0 md:pl-8'>
                                <label className='block text-sm font-bold text-gray-900 mb-3 border-b border-gray-100 pb-2'>Fecha de publicación</label>
                                <div className='flex flex-col sm:flex-row items-start sm:items-center gap-4 mt-4'>
                                    <div className='flex flex-col w-full sm:w-auto'>
                                        <span className='text-xs font-medium text-gray-500 mb-1 ml-1'>Desde:</span>
                                        <Input
                                            type="date"
                                            className='bg-gray-50 cursor-pointer text-sm'
                                            value={startDate}
                                            onChange={(e) => setStartDate(e.target.value)}
                                        />
                                    </div>
                                    <span className='hidden sm:block text-gray-400 mt-5'>→</span>
                                    <div className='flex flex-col w-full sm:w-auto'>
                                        <span className='text-xs font-medium text-gray-500 mb-1 ml-1'>Hasta:</span>
                                        <Input
                                            type="date"
                                            className='bg-gray-50 cursor-pointer text-sm'
                                            value={endDate}
                                            onChange={(e) => setEndDate(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/*Boton limpiar*/}
                        <div className='mt-6 pt-4 flex justify-between items-center border-t border-gray-100'>
                            {(startDate || endDate || categoryFilter) ? (
                                <Button variant="ghost" size="sm" className='text-red-500 hover:text-red-600 hover:bg-red-50' onClick={() => { setStartDate(''); setEndDate(''); setCategoryFilter(''); }}>
                                    Limpiar filtros
                                </Button>
                            ) : <div></div>
                            }

                            <Button variant="outline" size="sm" onClick={() => setShowAdvancedFilters(false)}>
                                Ocultar
                            </Button>
                        </div>
                    </div>
                )}

                {!featureUnavailable && <CreatePost onSubmit={handleNewPost} />}

                <div className="mt-7 flex flex-col gap-5">
                    {posts.map((post) => (
                        editingPostId === post.id ? (
                            <div key={post.id} className='bg-white rounded-2xl p-5 shadow-sm'>
                                <textarea
                                    className='w-full border border-gray-200 rounded-xl p-3 resize-none text-sm focus:outline-none focus:border-[#104084]'
                                    value={editPostContent}
                                    onChange={(e) => setEditPostContent(e.target.value)}
                                    rows={3}
                                />
                                <div className='flex gap-2 justify-end mt-2'>
                                    <Button variant="outline" size="sm" onClick={() => setEditingPostId(null)}>Cancelar</Button>
                                    <Button size="sm" onClick={() => handleEditPost(post.id)}>Guardar</Button>
                                </div>
                            </div>
                        ) : (
                            <PostCard
                                key={post.id}
                                postId={post.id}
                                authorName={post.authorName}
                                authorAvatar={post.authorAvatar}
                                content={post.content}
                                timestamp={post.timestamp}
                                category={post.category}
                                likes={post.likes}
                                views={post.views}
                                comments={post.commentCount}
                                pollOptions={post.pollOptions}
                                hasLiked={post.hasLiked}
                                hasVoted={post.hasVoted}
                                isOwner={post.isOwner}
                                isAdmin={isAdmin}
                                onCommentsClick={() => handleOpenComments(post)}
                                onLike={() => handleLike(post.id)}
                                onVote={(optionIndex) => handleVote(post.id, optionIndex)}
                                onEdit={() => { setEditingPostId(post.id); setEditPostContent(post.content); }}
                                onDelete={() => handleDeletePost(post.id)}
                            />
                        )
                    ))}
                </div>

                {/*Cargar mas*/}
                {hasMore && (
                    <div className='text-center py-6'>
                        <Button variant="outline" onClick={handleLoadMore} disabled={loading}>
                            {loading ? 'Cargando...' : 'Cargar más publicaciones'}
                        </Button>
                    </div>
                )}

                {!hasMore && posts.length > 0 && (
                    <p className='text-center text-gray-400 text-sm py-6'>No hay más publicaciones.</p>
                )}

                {posts.length === 0 && !loading && (
                    <p className='text-center text-gray-400 text-sm py-6'>No hay publicaciones. !Sé el primer en publicar!</p>
                )}

            </main>

            <CommentsModal
                isOpen={selectedPost !== null}
                onClose={() => { setSelectedPost(null); setCommentsList([]); }}
                postContent={selectedPost?.content || ''}
                postAuthor={selectedPost?.authorName || ''}
                comments={commentsList}
                isAdmin={isAdmin}
                onAddComment={handleAddComment}
                onEditComment={handleEditComment}
                onDeleteComment={handleDeleteComment}

            />
        </div>
    );


};


export default ForumPage;

