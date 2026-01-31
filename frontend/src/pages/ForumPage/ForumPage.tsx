import React, {useState} from 'react';
import Header from '../../components/common/Header/Header';
import Sidebar from '../../components/ui/Sidebar/Sidebar';
import CreatePost from '../../components/ui/CreatePost/CreatePost';
import PostCard from '../../components/ui/PostCard/PostCard';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './ForumPage.css';

type PostCategory = 'pregunta' | 'encuesta' | 'anuncio' | 'solicitud';

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
            comments: 3
        },
        {
            id: 2,
            authorName: 'Juan López',
            content: 'Recordad que mañana hay junta de vecinos a las 19:00 en el salón comunitario.',
            timestamp: 'Hace 5 horas',
            category: 'anuncio',
            likes: 50,
            views: 230,
            comments: 31
        },
    ]);

    const handleNewPost = (content: string, category: PostCategory) => {
        const newPost: Post = {
            id: Date.now(),
            authorName: 'Tú',
            content,
            timestamp: 'Ahora',
            category,
            likes: 0,
            views: 0,
            comments: 0
        };
        setPosts([newPost, ...posts]);
    };

    const handlePostClick = (postId: number) => {
        console.log('Post clicked:', postId);
    };
    
    return (
        <div>
            
            <Header 
                showCommunutySwitcher={true}
                navLinks={[
                    {label: <><i className="bi bi-list"></i> Comunidad</>, path: "#", onClick: () => setSidebarOpen(true)},
                    {label: "Calendario", path: "/calendar"},
                    {label: "Ayuda", path: "/help"}
                ]}
            />
            
                <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)}></Sidebar>

                <main className='container'>
                    <h1 className='fw-bold text-center mt-4 mb-4'>Foro comunitario</h1>

                    <CreatePost onSubmit={handleNewPost} />

                    <div className="posts-feed">
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
                                onPostClick={() => handlePostClick(post.id)}
                            />
                        ))}
                    </div>
                </main>
            
        </div>
    );


};


export default ForumPage;

