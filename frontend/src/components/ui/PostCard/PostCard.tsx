import React, {useState} from "react";
import {CircleUserRound, Heart, Eye, MessageCircle} from "lucide-react";

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

const categoryStyles = {
    pregunta : {bg: 'bg-blue-50', text: 'text-[#104084]'},
    encuesta: {bg: 'bg-yellow-50', text: 'text-yellow-700'},
    anuncio: {bg: 'bg-green-50', text: 'text-green-800'},
    solicitud: {bg: 'bg-red-50', text: 'text-red-800'}
};

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
            </div>

            <div className="mb-3">
                <p className="m-0 text-gray-900 leading-relaxed">{content}</p>
            </div>

            {category === 'encuesta' && localPollOptions.length > 0 && (
                <div className="my-3">
                    {localPollOptions.map((option, index) => (
                        <div key={index} 
                            className={`relative py-3 px-4 mb-2 border rounded-lg cursor-pointer overflow-hidden transition-all ${voted !== null ? '' : 'hover:border-[#104084] hover:bg-gray-50'} ${voted === index ? 'border-[#104084]' : 'border-gray-200'}`} 
                            onClick={(e) => handleVote(index, e)}>
                            <div className="absolute top-0 left-0 h-full bg-blue-50 transition-[width] duration-500" style={{ width: voted != null ? `${getPercentage(option.votes)}%` : '0%'}}></div>
                            <span className="relative z-10 font-medium">{option.text}</span>
                            {voted != null && (
                                <span className="relative z-10 float-right font-semibold text-[#104084]">{getPercentage(option.votes)}%</span>
                            )}
                        </div>
                    ))}
                    <span className="text-xs text-gray-500">{totalVotes} votos</span>
                </div>
            )}

            <div className="flex gap-5 pt-3 border-t border-gray-100">
                <span className={`flex items-center gap-1.5 text-sm cursor-pointer ${liked ? 'text-red-500' : 'text-gray-500'}`} onClick={handleLike}>
                    <Heart className='h-4 w-4' fill={liked ? "currentColor": "none" }/> {localLikes}
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