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
import { getPosts, createPost, updatePost, deletePost, toggleLike, getComments, addComment, updateComment, deleteComment, votePoll, pinPost, unpinPost, toggleCommentLike } from '@/services/forumService';
import { format } from "date-fns";
import { es } from 'date-fns/locale';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DateRange } from 'react-day-picker';
import { useNavigate } from 'react-router-dom';
import FeedbackModal from '@/components/ui/FeedbackModal/FeedbackModal';
import ConfirmModal from '@/components/ui/ConfirmModal/ConfirmModal';



type PostCategory = 'question' | 'poll' | 'announcement' | 'request';

interface PollOption {
    id: string;
    title: string;
    votes: number;
}

interface Poll {
    id: string;
    title: string;
    description: string | null;
    startsAt: string;
    endsAt: string;
    status: 'OPEN' | 'CLOSED';
    totalVotes: number;
    myVoteOptionId: string | null;
    options: PollOption[];
}

interface PostAuthor {
    membershipId: string;
    alias: string | null;
    profileImageUrl: string | null;
    role: string;
}

interface Post {
    id: string;
    title: string;
    description: string;
    category: PostCategory;
    pinned: boolean;
    createdAt: string;
    lastActivityAt: string;
    editedAt: string | null;
    author: PostAuthor | null;
    likesCount: number;
    commentsCount: number;
    poll: Poll | null;
}

interface Comment {
    id: string;
    postId: string;
    content: string;
    createdAt: string;
    editedAt: string;
    isDeleted: boolean;
    author: { membershipId: string; alias: string | null; profileImageUrl: string | null; role: string } | null;
    likesCount: number;
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
    const [sortBy, setSortBy] = useState<'createdAt' | 'likes' | 'lastActivityAt'>('createdAt');

    //Comentarios
    const [selectedPost, setSelectedPost] = useState<Post | null>(null);
    const [commentsList, setCommentsList] = useState<Comment[]>([]);
    const [commentsSortby, setCommentsSortBy] = useState<'createdAt' | 'likes'>('createdAt');

    //Editar post
    const [editingPostId, setEditingPostId] = useState<string | null>(null);
    const [editPostContent, setEditPostContent] = useState('');

    const [feedback, setFeedback] = useState<{isOpen: boolean, type: 'success' | 'error', message: string}>({isOpen: false, type: 'success', message: ''});
    const closeFeedback = () => setFeedback(prev => ({...prev, isOpen: false}));

    const [confirmAction, setConfirmAction] = useState<{isOpen: boolean; type: 'deletePost' | 'deleteComment' | null; idToDelete: string; title: string; message: string;}>({isOpen: false, type: null, idToDelete: '', title: '', message: ''});
    

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
            const res = await getPosts(communityId, {
                page: pageNum + 1,
                pageSize: 10,
                category: (categoryFilter as any) || undefined,
                from: startDate || undefined,
                to: endDate || undefined,
                sortBy
            });
            const newPosts = (res.data.items || []).map((p: any) => ({ ...p, category: p.category.toLowerCase() }));
            setPosts(prev => append ? [...prev, ...newPosts] : newPosts);
            const pagination = res.data.pagination;
            setHasMore(pagination.page < pagination.totalPages);
        } catch (err: any) {
            if (err?.response?.status === 404) {
                setFeatureUnavailable(true);
                setPosts([]);
                setHasMore(false);
            }
            console.error('Error cargando posts', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { setPage(0); loadPosts(0); }, [communityId, categoryFilter, startDate, endDate, sortBy]);

    const handleLoadMore = () => {
        const nextPage = page + 1;
        setPage(nextPage);
        loadPosts(nextPage, true);
    }

    //Crear post
    const handleNewPost = async (title: string, description: string, category: PostCategory, pollOptions?: string[]) => {
        if (!communityId) return;
        if (featureUnavailable) return;
        try {
            const data: any = { title, description, category }
            if (category === 'poll' && pollOptions) {
                data.poll = {
                    title,
                    options: pollOptions.map(opt => ({ title: opt }))
                };
            }
            await createPost(communityId, data);
            setPage(0);
            loadPosts(0);
        }
        catch (err: any) {
            setFeedback({isOpen: true, type: 'error', message: err.response?.data?.error?.message || 'Error al crear publicación.'});
        }
    };

    //Editar post
    const handleEditPost = async (postId: string) => {
        if (!communityId || !editPostContent.trim()) return;
        if (featureUnavailable) return;
        try {
            await updatePost(communityId, postId, { description: editPostContent });
            setPosts(prev => prev.map(p => 
                p.id === postId ? {...p, description: editPostContent, editedAt: new Date().toISOString()} : p
            ));
            setEditingPostId(null);
            setEditPostContent('');
        } catch (err: any) {
            setFeedback({isOpen: true, type: 'error', message: err.response?.data?.error?.message || 'Error al editar publicación.'});
        }
    };

    //Eliminar post
    const handleDeletePost = async (postId: string) => {
        if (!communityId) return;
        if (featureUnavailable) return;
        try {
            await deletePost(communityId, postId);
            setPosts(posts.filter(p => p.id !== postId));
        } catch (err: any) {
           setFeedback({isOpen: true, type: 'error', message: err.response?.data?.error?.message || 'Error al eliminar publicación.'});
        }
    };

    //Dar o quitar like
    const handleLike = async (postId: string) => {
        if (!communityId) return;
        if (featureUnavailable) return;
        try {
            const res = await toggleLike(communityId, postId);
            const newLikesCount = res.data.likesCount;
            setPosts(posts.map(p => p.id === postId ? { ...p, likesCount: newLikesCount, } : p));
        } catch (err: any) {
            console.error('Error al dar like', err);
        }
    };

    // Votar encuesta
    const handleVote = async (postId: string, pollId: string, optionId: string) => {
        if (!communityId) return;
        if (featureUnavailable) return;
        try {
            await votePoll(communityId, pollId, { optionId });
            setPage(0);
            loadPosts(0);
        } catch (err: any) {
            setFeedback({isOpen: true, type: 'error', message: err.response?.data?.error?.message || 'Error al votar en la publicación.'});
        }
    };

    //Fijar/desfijar publicacion
    const handleTogglePin = async (post: Post) => {
        if (!communityId) return;
        if (featureUnavailable) return;
        try {
            if (post.pinned) {
                await unpinPost(communityId, post.id);
            }
            else {
                await pinPost(communityId, post.id);
            }
            loadPosts(0);
            setPosts(prev => prev.map(p => p.id === post.id ? { ...p, pinned: !p.pinned } : p));
        }
        catch (err: any) {
            setFeedback({isOpen: true, type: 'error', message: err.response?.data?.error?.message || 'Error al fijar/desfijar la publicación.'});
        }
    };

    //Cargar comentarios
    const handleOpenComments = async (post: Post) => {
        setSelectedPost(post);
        setCommentsSortBy('createdAt');
        if (!communityId) return;
        if (featureUnavailable) return;
        try {
            const res = await getComments(communityId, post.id, { page: 1, pageSize: 50, sortBy: 'createdAt' });
            setCommentsList(res.data.items || []);
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
            setPosts(posts.map(p => p.id === selectedPost.id ? { ...p, commentsCount: p.commentsCount + 1 } : p));
        } catch (err: any) {
            setFeedback({isOpen: true, type: 'error', message: err.response?.data?.error?.message || 'Error al comentar en la publicación.'});
        }
    };

    // Editar comentario
    const handleEditComment = async (commentId: string, content: string) => {
        if (!communityId || !selectedPost) return;
        if (featureUnavailable) return;
        try {
            await updateComment(communityId, commentId, { content });
            setCommentsList(commentsList.map(c => c.id === commentId ? { ...c, content, editedAt: new Date().toISOString() } : c));
        } catch (err: any) {
           setFeedback({isOpen: true, type: 'error', message: err.response?.data?.error?.message || 'Error al editar comentario.'});
        }
    };

    // Eliminar comentario
    const handleDeleteComment = async (commentId: string) => {
        if (!communityId || !selectedPost) return;
        if (featureUnavailable) return;
        try {
            const res = await deleteComment(communityId, commentId);
            setCommentsList(commentsList.map(c => c.id === commentId ? res.data : c));
        } catch (err: any) {
            setFeedback({isOpen: true, type: 'error', message: err.response?.data?.error?.message || 'Error al eliminar comentario.'});
        }
    };

    //Like en comentario
    const handleLikeComment = async (commentId: string) => {
        if (!communityId) return;
        try {
            const res = await toggleCommentLike(communityId, commentId);
            setCommentsList(commentsList.map(c => c.id === commentId ? { ...c, likesCount: res.data.likesCount } : c));
        } catch (err: any) {
            console.error('Error al dar like al comentario', err);
        }
    };

    const reloadComments = async (sort: 'createdAt' | 'likes') => {
        if (!communityId || !selectedPost) return;
        try {
            const res = await getComments(communityId, selectedPost.id, { page: 1, pageSize: 50, sortBy: sort });
            setCommentsList(res.data.items || []);
        } catch (err) {
            console.error('Error recargando comentarios', err);
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

                <div className='flex justify-between items-center mb-4'>
                    <div className="flex gap-2">
                        <Button variant={sortBy === 'createdAt' ? 'default' : 'outline'} size="sm" onClick={() => setSortBy('createdAt')}>
                            Recientes
                        </Button>
                        <Button variant={sortBy === 'lastActivityAt' ? 'default' : 'outline'} size="sm" onClick={() => setSortBy('lastActivityAt')}>
                            Actividad
                        </Button>
                        <Button variant={sortBy === 'likes' ? 'default' : 'outline'} size="sm" onClick={() => setSortBy('likes')}>
                            Likes
                        </Button>
                        <Button variant={(categoryFilter || startDate || endDate) ? 'default' : 'outline'} size="sm" onClick={() => setShowAdvancedFilters(!showAdvancedFilters)} className='flex items-center gap-2'>
                            <Filter className='h-4 w-4' /> Filtros{(categoryFilter || startDate || endDate) && "(Activos)"}
                        </Button>
                    </div>
                </div>

                {showAdvancedFilters && (
                    <div className='bg-white rounded-2xl border border-gray-200 p-6 mb-6 shadow-sm'>
                        <div className='flex flex-col md:flex-row gap-6'>
                            {/*Filtro por categoria */}
                            <div className='flex-1 md:max-w-[200px]'>
                                <label className='block text-sm font-bold text-gray-900 mb-3 border-b border-gray-100 pb-2'>Categoría</label>
                                <div className='flex flex-col gap-2'>
                                    <Button variant={categoryFilter === '' ? 'default' : 'outline'} size="sm" onClick={() => setCategoryFilter('')}>Todos</Button>
                                    <Button variant={categoryFilter === 'question' ? 'default' : 'outline'} size="sm" onClick={() => setCategoryFilter('question')}>❓ Preguntas</Button>
                                    <Button variant={categoryFilter === 'poll' ? 'default' : 'outline'} size="sm" onClick={() => setCategoryFilter('poll')}>📊 Encuestas</Button>
                                    <Button variant={categoryFilter === 'announcement' ? 'default' : 'outline'} size="sm" onClick={() => setCategoryFilter('announcement')}>📢 Anuncios</Button>
                                    <Button variant={categoryFilter === 'request' ? 'default' : 'outline'} size="sm" onClick={() => setCategoryFilter('request')}>🙋 Solicitudes</Button>
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
                                title={post.title}
                                authorName={post.author?.alias || 'Anonimo'}
                                authorAvatar={post.author?.profileImageUrl || undefined}
                                content={post.description}
                                timestamp={post.createdAt}
                                category={post.category}
                                likes={post.likesCount}
                                comments={post.commentsCount}
                                pollOptions={post.poll?.options.map(opt => ({ text: opt.title, votes: opt.votes })) || undefined}
                                hasLiked={false}
                                hasVoted={post.poll?.myVoteOptionId ? post.poll.options.findIndex(o => o.id === post.poll!.myVoteOptionId) : null}
                                isOwner={post.author?.membershipId === activeCommunity?.membershipId}
                                isAdmin={isAdmin}
                                onCommentsClick={() => handleOpenComments(post)}
                                onLike={() => handleLike(post.id)}
                                onVote={(optionIndex) => {
                                    if (post.poll) {
                                        const option = post.poll.options[optionIndex];
                                        if (option) handleVote(post.id, post.poll.id, option.id);
                                    }
                                }}
                                onEdit={post.category !== 'poll' ? () => { setEditingPostId(post.id); setEditPostContent(post.description); } : undefined}
                                onDelete={() => setConfirmAction({ isOpen: true, type: 'deletePost', idToDelete: post.id, title: 'Eliminar Publicación', message: '¿Estás seguro de eliminar esta publicación?' })}
                                onPin={isAdmin ? () => handleTogglePin(post) : undefined}
                                pinned={post.pinned}
                                editedAt={post.editedAt}
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
                postTitle={selectedPost?.title || ''}
                postContent={selectedPost?.description || ''}
                postAuthor={selectedPost?.author?.alias || ''}
                comments={commentsList.map(c => ({
                    id: c.id,
                    authorName: c.author?.alias || 'Anonimo',
                    authorAvatar: c.author?.profileImageUrl || undefined,
                    content: c.content,
                    timestamp: c.createdAt,
                    isOwner: c.author?.membershipId === activeCommunity?.membershipId,
                    likesCount: c.likesCount,
                    editedAt: c.editedAt
                }))}
                isAdmin={isAdmin}
                onAddComment={handleAddComment}
                onEditComment={handleEditComment}
                onDeleteComment={(id) => setConfirmAction({ isOpen: true, type: 'deleteComment', idToDelete: id, title: 'Eliminar Comentario', message: '¿Estás seguro de eliminar este comentario?' })}
                onLikeComment={handleLikeComment}
                commentsSortBy={commentsSortby}
                onChangeCommentsSortBy={async (sort) => { setCommentsSortBy(sort); await reloadComments(sort); }}

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
                    if(confirmAction.type === 'deletePost') await handleDeletePost(confirmAction.idToDelete);
                    if(confirmAction.type === 'deleteComment') await handleDeleteComment(confirmAction.idToDelete);

                }}
            />
        </div>
    );


};


export default ForumPage;

