//Modal de comentarios de una publicación: listdo con likes, edición, eliminación y ordenación
import React, {useState} from "react";
import {Dialog, DialogContent, DialogHeader, DialogTitle} from '@/components/ui/dialog';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CircleUserRound, Send, Pencil, Trash2, X, Check, Heart } from "lucide-react";
import { formatUtcIsoInBusinessZone } from '@/lib/businessDateTime';


interface Comment{
    id: string;
    authorName: string;
    authorAvatar?: string;
    content: string;
    timestamp: string;
    isOwner?: boolean;
    likesCount?: number;
    editedAt?: string | null;
}

interface CommentsModalProps{
    isOpen: boolean;
    onClose: () => void;
    postTitle: string;
    postContent: string;
    postAuthor: string;
    comments: Comment[];
    isAdmin?: boolean;
    onAddComment: (content: string) => void;
    onEditComment?: (commentId: string, content: string) => void;
    onDeleteComment?: (commentId: string) => void;
    onLikeComment?: (commentId: string) => void;
    commentsSortBy?: 'createdAt' | 'likes';
    onChangeCommentsSortBy?: (sort: 'createdAt' | 'likes') => void;
}

const CommentsModal: React.FC<CommentsModalProps> = ({
    isOpen,
    onClose,
    postTitle,
    postContent,
    postAuthor,
    comments,
    isAdmin = false,
    onAddComment,
    onEditComment,
    onDeleteComment,
    onLikeComment, 
    commentsSortBy = 'createdAt',
    onChangeCommentsSortBy
}) => {
    const [newComment, setNewCommnet] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editContent, setEditContent] = useState('');

    if(!isOpen) return null;

    //Envía un nuevo comentario y limpia el campo de texto
    const handleSubmit = () => {
        if(newComment.trim()){
            onAddComment(newComment);
            setNewCommnet('');
        }
    };

    //Activa el modo edición de un comentario existente
    const startEdit = (comment: Comment) => {
        setEditingId(comment.id);
        setEditContent(comment.content);
    };

    //Confirma la edición del comentario y desactiva el modo de edición
    const confirmEdit = () => {
        if(editingId && editContent.trim() && onEditComment){
            onEditComment(editingId, editContent);
            setEditingId(null);
            setEditContent('');
        }
    };

    //Cancela la edición
    const cancelEdit = () => {
        setEditingId(null);
        setEditContent('');
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => {if(!open) onClose();}}>
            <DialogContent className="sm:max-w-md max-h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>{postTitle || 'Comentarios'}</DialogTitle>
                </DialogHeader>
                {/*Botones de ordenación por recientes o por likes*/}
                {onChangeCommentsSortBy && (
                    <div className="flex gap-2 pt-2">
                        <Button variant={commentsSortBy === 'createdAt' ? 'default' : 'outline'} size="sm" onClick={() => onChangeCommentsSortBy('createdAt')}>
                            Recientes
                        </Button>
                        <Button variant={commentsSortBy === 'likes' ? 'default' : 'outline'} size="sm" onClick={() => onChangeCommentsSortBy('likes')}>
                            Likes
                        </Button>
                    </div>
                )}

                <div className="flex-1 overflow-y-auto py-3 space-y-4">
                    {comments.length === 0 ? (
                        <p className="text-center text-gray-400 text-sm">No hay comentarios todavía. ¡Sé el primero!</p>
                    ) : (
                        /*Lista de comentarios*/
                        comments.map((comment) => (
                            <div className="flex gap-3" key={comment.id}>
                                <div className="w-9 h-9 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center shrink-0">
                                    {comment.authorAvatar ? (
                                        <img src={comment.authorAvatar} alt={comment.authorName} className="w-full h-full object-cover" />
                                    ) : (
                                        <CircleUserRound className="h-6 w-6 text-gray-400"/>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <div className="flex gap-2 items-center mb-1">
                                        <span className="font-semibold text-[13px]">{comment.authorName}</span>
                                        <span className="text-xs text-gray-400">{formatUtcIsoInBusinessZone(comment.timestamp, "dd/MM/yyyy HH:mm")}</span>
                                        {comment.editedAt && (
                                            <span className="text-xs text-gray-400 italic">• Editado: {formatUtcIsoInBusinessZone(comment.editedAt, "dd/MM/yyyy HH:mm")}</span>
                                        )}
                                        <div className="ml-auto flex gap-1">
                                            {comment.isOwner && onEditComment && editingId !== comment.id && (
                                                <button className="p-1 hover:bg-gray-100 rounded" onClick={() => startEdit(comment)}>
                                                    <Pencil className="h-3 w-3 text-gray-400"/>
                                                </button>
                                            )}
                                            {(comment.isOwner || isAdmin) && onDeleteComment && (
                                                <button className="p-1 hover:bg-red-50 rounded" onClick={() => onDeleteComment(comment.id)}>
                                                    <Trash2 className="h-3 w-3 text-red-400"/>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    {editingId === comment.id ? (
                                        <div className="flex gap-1">
                                            <Input
                                                value={editContent}
                                                onChange={(e) => setEditContent(e.target.value)}
                                                className="text-sm h-8"
                                                onKeyDown={(e) => e.key === 'Enter' && confirmEdit()}
                                            />
                                            <button className="p-1 hover:bg-green-50 rounded" onClick={confirmEdit}>
                                                <Check className="h-4 w-4 text-green-600"/>
                                            </button>
                                            <button className="p-1 hover:bg-gray-100 rounded" onClick={cancelEdit}>
                                                <X className="h-4 w-4 text-gray-400"/>
                                            </button>
                                        </div>
                                    ) : (
                                        <p className="m-0 text-sm">{comment.content}</p>
                                    )}
                                    {onLikeComment && (
                                        <button className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 mt-1 transition-colors" onClick={() => onLikeComment(comment.id)}>
                                            <Heart className="h-3 w-3" /> {comment.likesCount ?? 0}
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>

            {/*Campo de texto y botón para enviar un nuevo comentario*/}
            <div className="flex gap-2.5 pt-3 border-t border-gray-200">
                <Input 
                    placeholder="Escribe un comentario..." 
                    value={newComment} 
                    onChange={(e) => setNewCommnet(e.target.value)} 
                    onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                    className="rounded-full" />
                <Button size="sm" onClick={handleSubmit} disabled={!newComment.trim()}>
                    <Send className="h-4 w-4"/>
                </Button>
            </div>

            </DialogContent>
        </Dialog>
    );
};

export default CommentsModal;