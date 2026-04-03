import React, {useState, useEffect, useRef} from "react";
import {CircleUserRound, Heart, Eye, MessageCircle, MoreHorizontal, Pencil, Trash2} from "lucide-react";

type PostCategory = 'question' | 'poll' | 'announcement' | 'request';


interface PollOption {
    text: string;
    votes: number;
}

interface PostCardProps{
    postId: string;
    authorName: string;
    authorAvatar?: string;
    content: string;
    timestamp: string;
    category: PostCategory;
    likes: number;
    views: number;
    comments: number;
    pollOptions?: PollOption[];
    hasLiked?: boolean;
    hasVoted?: number | null;
    isOwner?: boolean;
    isAdmin?: boolean;
    onCommentsClick: () => void;
    onLike: () => void;
    onVote: (optionIndex: number) => void;
    onEdit?: () => void;
    onDelete?: () => void;
}

const categoryStyles = {
    question : {bg: 'bg-blue-50', text: 'text-[#104084]'},
    poll: {bg: 'bg-yellow-50', text: 'text-yellow-700'},
    announcement: {bg: 'bg-green-50', text: 'text-green-800'},
    request: {bg: 'bg-red-50', text: 'text-red-800'}
};

const categoryLabels = {
    question: {emoji: '❓', label: 'Pregunta'},
    poll: {emoji: '📊', label: 'Encuesta'},
    announcement: {emoji: '📢', label: 'Anuncio'},
    request: {emoji: '🙋', label: 'Solicitud'}
};

const PostCard: React.FC<PostCardProps> = ({
    postId,
    authorName,
    authorAvatar,
    content,
    timestamp,
    category,
    likes,
    views,
    comments,
    pollOptions,
    hasLiked = false,
    hasVoted = null,
    isOwner = false,
    isAdmin = false,
    onCommentsClick,
    onLike,
    onVote,
    onEdit,
    onDelete
}) =>{

    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if(menuRef.current && !menuRef.current.contains(event.target as Node)){
                setMenuOpen(false);
            }
        };
        if(menuOpen){
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [menuOpen]);

    const totalVotes = (pollOptions || []).reduce((sum, opt) => sum + opt.votes, 0);

    const getPercentage = (votes: number) => {
        if(totalVotes === 0) return 0;
        return Math.round((votes / totalVotes) * 100);
    };

    const handleCommentsClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onCommentsClick();
    };

    const handleLike = (e: React.MouseEvent) => {
        e.stopPropagation();
        onLike();
    };

    const handleVote = (index: number, e: React.MouseEvent) => {
        e.stopPropagation();
        if(hasVoted === null){
            onVote(index);
        }
    };

    const catStyle = categoryStyles[category];

    return(
        <div className="bg-white rounded-2xl p-5 mb-4 shadow-sm cursor-pointer transition-shadow hover:shadow-md">
            <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                    {authorAvatar ? (
                        <img src={authorAvatar} alt={authorName} className="w-full h-full object-cover" />
                    ) : (
                        <CircleUserRound className="h-7 w-7 text-gray-400"/>
                    )}
                </div>
                <div className="flex flex-col flex-1">
                    <span className="font-semibold text-gray-900">{authorName}</span>
                    <span className="text-xs text-gray-400">{timestamp}</span>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${catStyle.bg} ${catStyle.text}`}>
                    {categoryLabels[category].emoji} {categoryLabels[category].label}
                </span>
                {/*Menu de acciones*/}
                {(isOwner || isAdmin) && (
                    <div className="relative" ref={menuRef}>
                        <button className="p-1 hover:bg-gray-100 rounded-full" onClick={(e) => {e.stopPropagation(); setMenuOpen(!menuOpen); }}>
                            <MoreHorizontal className="h-5 w-5 text-gray-400"/>
                        </button>
                        {menuOpen && (
                            <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10 min-w-[140px]">
                                {isOwner && onEdit && (
                                    <button className="w-full px-3 py-2 text-sm text-left hover:bg-gray-50 flex items-center gap-2" onClick={(e) => {e.stopPropagation(); setMenuOpen(false); onEdit(); }}>
                                        <Pencil className="h-4 w-4"/> Editar
                                    </button>
                                )}
                                {(isOwner || isAdmin) && onDelete && (
                                    <button className="w-full px-3 py-2 text-sm text-left text-red-600 hover:bg-red-50 flex items-center gap-2" onClick={(e) => {e.stopPropagation(); setMenuOpen(false); onDelete(); }}>
                                        <Trash2 className="h-4 w-4"/> Eliminar
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="mb-3">
                <p className="m-0 text-gray-900 leading-relaxed">{content}</p>
            </div>

            {category === 'poll' && pollOptions && pollOptions.length > 0 && (
                <div className="my-3">
                    {pollOptions.map((option, index) => (
                        <div key={index} 
                            className={`relative py-3 px-4 mb-2 border rounded-lg overflow-hidden transition-all ${hasVoted !== null ? '' : 'hover:border-[#104084] hover:bg-gray-50 cursor-pointer'} ${hasVoted === index ? 'border-[#104084]' : 'border-gray-200'}`} 
                            onClick={(e) => handleVote(index, e)}>
                            <div className="absolute top-0 left-0 h-full bg-blue-50 transition-[width] duration-500" style={{ width: hasVoted != null ? `${getPercentage(option.votes)}%` : '0%'}}></div>
                            <span className="relative z-10 font-medium">{option.text}</span>
                            {hasVoted != null && (
                                <span className="relative z-10 float-right font-semibold text-[#104084]">{getPercentage(option.votes)}%</span>
                            )}
                        </div>
                    ))}
                    <span className="text-xs text-gray-500">{totalVotes} votos</span>
                </div>
            )}

            <div className="flex gap-5 pt-3 border-t border-gray-100">
                <span className={`flex items-center gap-1.5 text-sm cursor-pointer ${hasLiked ? 'text-red-500' : 'text-gray-500'}`} onClick={handleLike}>
                    <Heart className='h-4 w-4' fill={hasLiked ? "currentColor": "none" }/> {likes}
                </span>
                <span className="flex items-center gap-1.5 text-sm text-gray-500">
                    <Eye className="h-4 w-4"/> {views}
                </span>
                <span className="flex items-center gap-1.5 text-sm text-gray-500 cursor-pointer hover:text-[#104084]" onClick={handleCommentsClick}>
                    <MessageCircle className="h-4 w-4"/> {comments}
                </span>
            </div>
        </div>
    );
};

export default PostCard;