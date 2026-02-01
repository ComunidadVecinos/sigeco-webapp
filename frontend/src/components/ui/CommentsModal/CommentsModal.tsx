import React, {useState} from "react";
import './CommentsModal.css';

interface Comment{
    id: number;
    authorName: string;
    authorAvatar?: string;
    content: string;
    timestamp: string;
}

interface CommentsModalProps{
    isOpen: boolean;
    onClose: () => void;
    postContent: string;
    postAuthor: string;
    comments: Comment[];
    onAddComment: (content: string) => void;
}

const CommentsModal: React.FC<CommentsModalProps> = ({
    isOpen,
    onClose,
    postContent,
    postAuthor,
    comments,
    onAddComment
}) => {
    const [newComment, setNewCommnet] = useState('');

    if(!isOpen) return null;

    const handleSubmit = () => {
        if(newComment.trim()){
            onAddComment(newComment);
            setNewCommnet('');
        }
    };

    return (
        <>
            <div className="modal-overlay" onClick={onClose}></div>
            <div className="comments-modal">
                <div className="comments-modal-header">
                    <h5>Comentarios</h5>
                    <button className="btn-close-modal" onClick={onClose}>
                        <i className="bi bi-x-lg"></i>
                    </button>
                </div>

                <div className="comments-modal-post">
                    <span className="post-author">{postAuthor}</span>
                    <p>{postContent}</p>
                </div>

                <div className="comments-list">
                    {comments.length === 0 ? (
                        <p className="no-comments">No hay comentarios todavía. ¡Sé el primero!</p>
                    ) : (
                        comments.map((comment) => (
                            <div className="comment-item" key={comment.id}>
                                <div className="comment-avatar">
                                    {comment.authorAvatar ? (
                                        <img src={comment.authorAvatar} alt={comment.authorName} />
                                    ) : (
                                        <i className="bi bi-person-circle"></i>
                                    )}
                                </div>
                                <div className="comment-content">
                                    <div className="comment-header">
                                        <span className="comment-author">{comment.authorName}</span>
                                        <span className="comment-time">{comment.timestamp}</span>
                                    </div>
                                    <p>{comment.content}</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="comments-modal-footer">
                    <input type="text" placeholder="Escribe un comentario..." value={newComment} onChange={(e) => setNewCommnet(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSubmit()} />
                    <button className="btn btn-primary btn-sm" onClick={handleSubmit} disabled={!newComment.trim()}>
                        <i className="bi bi-send"></i>
                    </button>
                </div>
            </div>
        </>
    );
};

export default CommentsModal;