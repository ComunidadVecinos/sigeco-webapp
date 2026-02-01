import React, {useState} from "react";
import './PostCard.css';

type PostCategory = 'pregunta' | 'encuesta' | 'anuncio' | 'solicitud';


interface PollOption {
    text: string;
    votes: number;
}

interface PostCardProps{
    authorName: string;
    authorAvatar?: string;
    content: string;
    timestamp: string;
    category: PostCategory;
    likes: number;
    views: number;
    comments: number;
    pollOptions?: PollOption[];
    onCommentsClick: () => void;
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
    pollOptions,
    onCommentsClick
}) =>{

    const [voted, setVoted] = useState<number | null>(null);
    const [localPollOptions, setLocalPollOptions] = useState(pollOptions || []);

    const totalVotes = localPollOptions.reduce((sum, opt) => sum + opt.votes, 0);

    const handleVote = (index: number, e: React.MouseEvent) => {
        e.stopPropagation();
        if(voted === null){
            const newOptions = [...localPollOptions];
            newOptions[index] = {...newOptions[index], votes: newOptions[index].votes + 1};
            setLocalPollOptions(newOptions);
            setVoted(index);
        }
    };

    const getPercentage = (votes: number) => {
        if(totalVotes === 0) return 0;
        return Math.round((votes / totalVotes) * 100);
    };

    const [liked, setLiked] = useState(false);
    const [localLikes, setLocalLikes] = useState(likes);

    const handleLike = (e: React.MouseEvent) => {
        e.stopPropagation();
        if(!liked){
            setLocalLikes(localLikes + 1);
            setLiked(true);
        }
        else{
            setLocalLikes(localLikes - 1);
            setLiked(false);
        }
    };

    const handleCommentsClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onCommentsClick();
    };

    return(
        <div className="post-card">
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

            {category === 'encuesta' && localPollOptions.length > 0 && (
                <div className="poll-container">
                    {localPollOptions.map((option, index) => (
                        <div key={index} className={`poll-option-vote ${voted !== null ? 'voted' : ''} ${voted === index ? 'selected' : ''}`} onClick={(e) => handleVote(index, e)}>
                            <div className="poll-bar" style={{ width: voted != null ? `${getPercentage(option.votes)}%` : '0%'}}></div>
                            <span className="poll-text">{option.text}</span>
                            {voted != null && (
                                <span className="poll-percentage">{getPercentage(option.votes)}%</span>
                            )}
                        </div>
                    ))}
                    <span className="poll-total">{totalVotes} votos</span>
                </div>
            )}

            <div className="post-stats">
                <span className={`post-stat ${liked ? 'liked' : ''}`} onClick={handleLike}>
                    <i className={`bi ${liked ? 'bi-heart-fill' : 'bi-heart'}`}></i> {localLikes}
                </span>
                <span className="post-stat">
                    <i className="bi bi-eye"></i> {views}
                </span>
                <span className="post-stat clickable" onClick={handleCommentsClick}>
                    <i className="bi bi-chat"></i> {comments}
                </span>
            </div>
        </div>
    );
};

export default PostCard;