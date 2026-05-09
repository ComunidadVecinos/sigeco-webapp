//Tarjeta de votación: opciones con barra de progreso, cuenta atrás y menú de admin
import React, {useState, useEffect, useRef} from 'react';
import {CheckCircle2, Clock, Users, MoreHorizontal, Lock, Trash2, CircleUserRound} from 'lucide-react';
import { formatUtcIsoInBusinessZone } from '@/lib/businessDateTime';

interface VotingOption {
    id: string;
    title: string;
    votes: number;
}

interface VotingCardProps {
    id: string;
    title: string;
    description?: string | null;
    creatorAlias?: string | null;
    createdAt: string;
    endsAt: string | null;
    status: 'OPEN' | 'CLOSED';
    totalVotes: number;
    possibleVoters: number;
    myVoteOptionId: string | null;
    options: VotingOption[];
    isAdmin?: boolean;
    onVote: (votingId: string, optionId: string) => void;
    onClose?: (votingId: string) => void;
    onDelete?: (votingId: string) => void;
}

//Calcula el tiempo restante hasta el cierre de la votación
function getTimeRemaining(endsAt: string | null): string {
    if(!endsAt) return 'Sin fecha de cierre';
    const now = new Date().getTime();
    const end = new Date(endsAt).getTime();
    const diff = end - now;

    if(diff <= 0) return 'Finalizada';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);

    if(days > 0) return `${days}d ${hours}h ${minutes}m`;
    if(hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
}

const VotingCard: React.FC<VotingCardProps> = ({id, title, description, creatorAlias, createdAt, endsAt, status, totalVotes, possibleVoters, myVoteOptionId, options, isAdmin = false, onVote, onClose, onDelete}) => {
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [menuOpen, setMenuOpen] = useState(false);
    const [countdown, setCountdown] = useState(() => getTimeRemaining(endsAt));
    const menuRef = useRef<HTMLDivElement>(null);

    const isOpen = status === 'OPEN';
    const hasVoted = myVoteOptionId !== null;
    const participationPercent = possibleVoters > 0 ? Math.round((totalVotes / possibleVoters) * 100) : 0;

    //Actualiza la cuenta atrás cada minuto mientras las votación esté abierta
    useEffect(() => {
        if(!isOpen || !endsAt) return;
        const interval = setInterval(() => {
            setCountdown(getTimeRemaining(endsAt));
        }, 60_000);
        return () => clearInterval(interval);
    }, [endsAt, isOpen]);

    //Cierra el menú de acciones al hacer clic fuera
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if(menuRef.current && !menuRef.current.contains(event.target as Node)){
                setMenuOpen(false);
            }
        };
        if(menuOpen) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [menuOpen]);

    //Emite el voto si hay ópcion seleccionada, no ha votado aún y la votación sigue abierta
    const handleVote = () => {
        if(selectedOption && !hasVoted && isOpen){
            onVote(id, selectedOption);
            setSelectedOption(null);
        }
    };

    const maxVotes = Math.max(...options.map(o => o.votes), 0);
    const formattedDate = formatUtcIsoInBusinessZone(createdAt, "d 'de' MMMM 'de' yyyy");

    return (
        <div className={`bg-white rounded-2xl shadow-sm border overflow-hidden transition-shadow hover:shadow-md ${isOpen ? 'border-gray-100' : 'border-gray-200'}`}>
            <div className="p-5 pb-3">
                <div className='flex items-start justify-between gap-3'>
                    <div className='flex-1 min-w-0'>
                        <div className='flex items-center gap-2.5 mb-2 flex-wrap'>
                            <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wide ${isOpen ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-gray-100 text-gray-500 border border-gray-200'}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${isOpen ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`} />
                                {isOpen ? 'Abierta' : 'Cerrada'} 
                            </span>
                            {isOpen && endsAt && (
                                <span className='text-xs text-gray-400 flex items-center gap-1'>
                                    <Clock className='h-3 w-3' /> Cierra en {countdown}
                                </span>
                            )}
                        </div>
                        <h3 className='font-bold text-lg text-gray-900 mb-1'>{title}</h3>
                        {description && <p className='text-sm text-gray-500 leading-relaxed mb-2'>{description}</p>}
                        <p className='text-xs text-gray-400'>
                            {creatorAlias && <>por <span className='font-medium text-gray-500'>{creatorAlias}</span> · </>}
                            {formattedDate}
                        </p>
                    </div>

                    {isAdmin && (
                        <div className='relative' ref={menuRef}>
                            <button className='p-1.5 hover:bg-gray-100 rounded-full transition-colors' onClick={() => setMenuOpen(!menuOpen)}>
                                <MoreHorizontal className='h-5 w-5 text-gray-400' />
                            </button>
                            {menuOpen && (
                                <div className='absolute right-0 top-9 bg-white border border-gray-200 rounded-xl shadow-lg py-1 z-10 min-w-[170px]'>
                                    {isOpen && onClose && (
                                        <button className='w-full px-3 py-2 text-sm text-left hover:bg-gray-50 flex items-center gap-2 text-amber-700' onClick={() => {setMenuOpen(false); onClose(id);}}>
                                            <Lock className='h-4 w-4' /> Cerrar votación
                                        </button>
                                    )}
                                    {onDelete && (
                                        <button className='w-full px-3 py-2 text-sm text-left text-red-600 hover:bg-red-50 flex items-center gap-2' onClick={() => {setMenuOpen(false); onDelete(id)}}>
                                            <Trash2 className='h-4 w-4' /> Eliminar
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
            
            {/*Lista de opciones: seleccionable si no ha votado, con barra de progreso animda*/}
            <div className='px-5 pb-3 space-y-2'>
                {options.map((option) => {
                    const percent = totalVotes > 0 ? Math.round((option.votes / totalVotes) * 100) : 0;
                    const isMyVote = myVoteOptionId === option.id;
                    const isWinner = !isOpen && option.votes === maxVotes && maxVotes > 0;
                    const canSelect = isOpen && !hasVoted;

                    return(
                        <div key={option.id} className={`relative rounded-xl overflow-hidden transition-all ${canSelect ? 'cursor-pointer' : 'cursor-default'} ${canSelect ? 'hover:ring-2 hover:ring-blue-200' : ''} ${selectedOption === option.id ? 'ring-2 ring-blue-500' : ''} ${isMyVote ? 'ring-2 ring-emerald-400' : ''}`} onClick={() => canSelect && setSelectedOption(option.id)}>

                            <div className={`absolute inset-0 transition-[width] duration-700 ease-out rounded-xl ${ isWinner ? 'bg-gradient-to-r from-amber-50 to-amber-100/80' : isMyVote ? 'bg-gradient-to-r from-emerald-50 to-emerald-100/60' : 'bg-gradient-to-r from-blue-50 to-indigo-50/60'}`} style={{width: hasVoted || !isOpen ? `${percent}%` : '0%'}}/>

                            <div className='relative flex items-center justify-between py-3 px-4 border border-gray-200 rounded-xl'>
                                <div className='flex items-center gap-2.5'>
                                    {canSelect && (
                                        <div className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${selectedOption === option.id ? 'border-blue-500 bg-blue-500' : 'border-gray-300'}`}>
                                            {selectedOption === option.id && <div className='w-1.5 h-1.5 rounded-full bg-white'/>}
                                        </div>
                                    )}
                                    {isMyVote && <CheckCircle2 className='h-4 w-4 text-emerald-500 shrink-0' />}
                                    <span className={`text-sm font-medium ${isWinner ? 'text-amber-800' : isMyVote ? 'text-emerald-800' : 'text-gray-800'}`}>{option.title}</span>
                                </div>
                                {(hasVoted || !isOpen) && (
                                    <div className='flex items-center gap-2'>
                                        <span className='text-xs text-gray-500'>{option.votes} votos</span>
                                        <span className={`text-sm font-bold min-w-[40px] text-right ${isWinner ? 'text-amber-700' : 'text-gray-700'}`}>{percent}%</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/*Participación total y botón de votar o confirmaci´pon de voto emitido*/}
            <div className='px-5 py-3 border-t border-gray-100 flex items-center justify-between flex-wrap gap-2'>
                <div className='flex items-center gap-4 text-xs text-gray-400'>
                    <span className='flex items-center gap-1'>
                        <Users className='h-3.5 w-3.5' />
                        {totalVotes} / {possibleVoters} participantes ({participationPercent}%)
                    </span>
                </div>

                {isOpen && !hasVoted && (
                    <button disabled={!selectedOption} onClick={handleVote} className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${selectedOption ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm' : 'bg-gray-100 text-gray-400 cursor-not-allowed' }`}>Votar</button>
                )}
                {hasVoted && (
                    <span className='text-xs text-emerald-600 font-medium flex items-center gap-1'>
                        <CheckCircle2 className='h-3.5 w-3.5' /> Tu voto ha sido registrado
                    </span>
                )}
            </div>
        </div>
    );
};

export default VotingCard;