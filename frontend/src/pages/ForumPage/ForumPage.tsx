import React, {useState} from 'react';
import Header from '../../components/common/Header/Header';
import Sidebar from '../../components/ui/Sidebar/Sidebar';
import CreatePost from '../../components/ui/CreatePost/CreatePost';
import PostCard from '../../components/ui/PostCard/PostCard';
import CommentsModal from '../../components/ui/CommentsModal/CommentsModal';
import {Menu} from 'lucide-react';

type PostCategory = 'pregunta' | 'encuesta' | 'anuncio' | 'solicitud';

interface Comment{
    id: number;
    authorName: string;
    authorAvatar?: string;
    content: string;
    timestamp: string;
}

interface Post{
    id: number;
    authorName: string;
    authorAvatar?: string;
    content: string;
    timestamp: string;
    category: PostCategory;
    likes: number;
    views: number;
    comments: number;
    pollOptions?: {text: string; votes: number }[];
    commentsList: Comment[];
}


const ForumPage: React.FC = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [posts, setPosts] = useState<Post[]>([
        {
            id: 1,
            authorName: 'María García',
            content: '¿Alguien sabe a qué hora pasa el jardinero esta semana?',
            timestamp: 'Hace 2 horas',
            category: 'pregunta',
            likes: 5,
            views: 23,
            comments: 3,
            commentsList: [{ id: 1, authorName: 'Pedro Ruiz', content: 'Creo que pasa los martes por la mañana', timestamp: 'Hace 1 hora' },
            { id: 2, authorName: 'Ana López', content: 'Sí, sobre las 10:00', timestamp: 'Hace 30 min' }
    ]
        },
        {
            id: 2,
            authorName: 'Juan López',
            content: 'Recordad que mañana hay junta de vecinos a las 19:00 en el salón comunitario.',
            timestamp: 'Hace 5 horas',
            category: 'anuncio',
            likes: 50,
            views: 230,
            comments: 31,
            commentsList: []
        },
        {
            id: 3,
            authorName: 'Carlos Ruiz',
            content: '¿Qué día preferís para la próxima junta?',
            timestamp: 'Hace 1 día',
            category: 'encuesta',
            likes: 8,
            views: 67,
            comments: 4,
            commentsList: [],
            pollOptions: [
                { text: 'Lunes', votes: 5 },
                { text: 'Miércoles', votes: 12 },
                { text: 'Viernes', votes: 3 },
                
            ]
        }
    ]);

    const [selectedPost, setSelectedPost] = useState<Post | null>(null);

    const handleNewPost = (content: string, category: PostCategory, pollOptions?: string[]) => {
        const newPost: Post = {
            id: Date.now(),
            authorName: 'Tú',
            content,
            timestamp: 'Ahora',
            category,
            likes: 0,
            views: 0,
            comments: 0,
            commentsList: [],
            pollOptions: pollOptions ? pollOptions.map(opt => ({text:opt, votes:0})): undefined
        };
        setPosts([newPost, ...posts]);
    };

    const handlePostClick = (post: Post) => {
        setSelectedPost(post);
    };
    
    const handleAddComment = (content: string) => {
        if(selectedPost) {
            const newComment: Comment = {
                id: Date.now(),
                authorName: 'Tú',
                content,
                timestamp: 'Ahora'
            };

            const updatedPosts = posts.map(post =>
                post.id === selectedPost.id ? {...post, comments: post.comments + 1, commentsList: [...post.commentsList, newComment]}: post);
                setPosts(updatedPosts);
                setSelectedPost({...selectedPost, commentsList: [...selectedPost.commentsList, newComment]});
        }
    };

    return (
        <div>
            
            <Header 
                showCommunutySwitcher={true}
                navLinks={[
                    {label: <><Menu className="h-4 w-4 inline mr-1"/> Comunidad</>, path: "#", onClick: () => setSidebarOpen(true)},
                    {label: "Calendario", path: "/calendar"},
                    {label: "Ayuda", path: "/help"}
                ]}
            />
            
                <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)}></Sidebar>

                <main className='max-w-[700px] mx-auto pt-[250px] md:pt-[200px]'>
                    <h1 className='text-[28px] font-bold mb-7 text-center'>Foro comunitario</h1>

                    <CreatePost onSubmit={handleNewPost} />

                    <div className="mt-7 flex flex-col gap-5">
                        {posts.map((post) => (
                            <PostCard
                                key={post.id}
                                authorName={post.authorName}
                                authorAvatar={post.authorAvatar}
                                content={post.content}
                                timestamp={post.timestamp}
                                category={post.category}
                                likes={post.likes}
                                views={post.views}
                                comments={post.comments}
                                pollOptions={post.pollOptions}
                                onCommentsClick={() => handlePostClick(post)}
                            />
                        ))}
                    </div>
                </main>
            <CommentsModal
                isOpen={selectedPost !== null}
                onClose={() => setSelectedPost(null)}
                postContent={selectedPost?.content || ''}
                postAuthor={selectedPost?.authorName || ''}
                comments={selectedPost?.commentsList || []}
                onAddComment={handleAddComment}
            />
        </div>
    );


};


export default ForumPage;

