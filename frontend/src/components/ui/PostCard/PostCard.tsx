import React from "react";
import './PostCard.css';

type PostCategory = 'pregunta' | 'encuesta' | 'anuncio' | 'solicitud';

interface PostCardProps{
    authorName: string;
    authorAvatar?: string;
    content: string;
    timestamp: string;
    category: PostCategory;
    likes: number;
    views: number;
    comments: number;
    onPostClick: () => void;
}

const categoryLabels = {
    pregunta: {emoji: '❓', label: 'Pregunta'},
    encuesta: {emoji: '📊', label: 'Encuesta'},
    anuncio: {emoji: '📢', label: 'Anuncio'},
    solicitud: {emoji: '🙋', label: 'Solicitud'}
};

const PostCard: React.FC<PostCardProps> = ({
    authorName,
    authorAvatar,
    content,
    timestamp,
    category,
    likes,
    views,
    comments,
    onPostClick
}) =>{
    return(
        <div className="post-card" onClick={onPostClick}>
            <div className="post-header">
                <div className="post-avatar">
                    {authorAvatar ? (
                        <img src={authorAvatar} alt={authorName} />
                    ) : (
                        <i className="bi bi-person-circle"></i>
                    )}
                </div>
                <div className="post-author-info">
                    <span className="post-author-name">{authorName}</span>
                    <span className="post-timestamp">{timestamp}</span>
                </div>
                <span className={`post-category category-${category}`}>
                    {categoryLabels[category].emoji} {categoryLabels[category].label}
                </span>
            </div>

            <div className="post-content">
                <p>{content}</p>
            </div>

            <div className="post-stats">
                <span className="post-start">
                    <i className="bi bi-heart"></i> {likes}
                </span>
                <span className="post-start">
                    <i className="bi bi-eye"></i> {views}
                </span>
                <span className="post-start">
                    <i className="bi bi-chat"></i> {comments}
                </span>
            </div>
        </div>
    );
};

export default PostCard;