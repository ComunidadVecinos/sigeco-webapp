import React, {useState} from "react";
import {Dialog, DialogContent, DialogHeader, DialogTitle} from '@/components/ui/dialog';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CircleUserRound, Send } from "lucide-react";


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
            <Dialog open={isOpen} onOpenChange={(open) => {if(!open) onClose();}}>
                <DialogContent className="sm:max-w-md max-h-[80vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>Comentarios</DialogTitle>
                    </DialogHeader>

                    <div className="px-1 py-3 bg-gray-50 rounded-lg border-b border-gray-200">
                        <span className="font-semibold text-sm">{postAuthor}</span>
                        <p className="mt-2 text-sm text-gray-600 m-0">{postContent}</p>
                    </div>

                    <div className="flex-1 overflow-y-auto py-3 space-y-4">
                    {comments.length === 0 ? (
                        <p className="text-center text-gray-400 text-sm">No hay comentarios todavía. ¡Sé el primero!</p>
                    ) : (
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
                                        <span className="text-xs text-gray-400">{comment.timestamp}</span>
                                    </div>
                                    <p className="m-0 text-sm">{comment.content}</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="flex gap-2.5 pt-3 border-t border-gray-200">
                    <Input 
                        placeholder="Escribe un comentario..." 
                        value={newComment} 
                        onChange={(e) => setNewCommnet(e.target.value)} 
                        onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
                        className="rounded-full" />
                    <Button size="sm" onClick={handleSubmit} disabled={!newComment.trim()}>
                        <Send className="h-4 w-4"/>
                    </Button>
                </div>

                </DialogContent>
            </Dialog>
        </>
    );
};

export default CommentsModal;