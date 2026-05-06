import React, {useState, useEffect} from 'react';
import {Link} from 'react-router-dom';
import { X, Megaphone, MessageCircle, CalendarCheck, AlertTriangle, CheckSquare, Folder } from 'lucide-react';
import { useAuth } from '@/context/authContext';
import imagen_generica from '@/assets/images/perfil_generico.png';

interface SidebarContentProps{
    onClose?: () => void;
}

const linkClass = "flex items-center gap-3 px-4 py-3.5 text-gray-600 no-underline rounded-[10px] text-[15px] transition-all hover:bg-[#104084] hover:text-white hover:translate-x-1";

const SidebarContent: React.FC<SidebarContentProps> = ({onClose}) => {

    const {user} = useAuth();
    const activeCommunity = user?.communities?.find(c => c.communityId === user?.activeCommunityId);

    const [avatarKey, setAvatarKey] = useState(Date.now());
    useEffect(() => {
        setAvatarKey(Date.now());
    }, [user]);

    const communityAvatarUrl = (activeCommunity as any)?.avatarUrl;

    return(
        <>
            <button className="absolute top-5 right-5 bg-transparent border-none text-gray-500 cursor-pointer hover:text-gray-900 transition-colors" onClick={onClose}>
                <X className="h-6 w-6"/>
            </button>

            <div className="flex justify-between items-center mb-7 pb-5 border-b-2 border-gray-200 pr-8">
                <div className='flex items-center gap-3'>
                    <img src={communityAvatarUrl ? `${communityAvatarUrl}?t=${avatarKey}` : imagen_generica} alt="Mi comunidad" 
                        className='w-10 h-10 rounded-full object-cover border border-gray-200 shrink-0' />
                    
                    <h4 className='font-bold text-lg m-0 leading-tight'>
                        {activeCommunity?.name || 'Mi comunidad'}
                    </h4>
                </div>
            </div>

            <h5 className='text-[#104084] text-sm uppercase tracking-wider mb-4 font-semibold'>Espacio Comunitario</h5>

            <nav className="flex flex-col gap-2">
                <Link to="/news" className={linkClass}><Megaphone className="h-[18px] w-[18px]"/>Tablón de noticias</Link>
                <Link to="/forum" className={linkClass}><MessageCircle className="h-[18px] w-[18px]"/>Foro</Link>
                <Link to="/reservations" className={linkClass}><CalendarCheck className="h-[18px] w-[18px]"/>Reserva de espacios</Link>
                <Link to="/incidents" className={linkClass}><AlertTriangle className="h-[18px] w-[18px]"/>Incidencias</Link>
                <Link to="/voting" className={linkClass}><CheckSquare className="h-[18px] w-[18px]"/>Votaciones</Link>
                <Link to="/documents" className={linkClass}><Folder className="h-[18px] w-[18px]"/>Documentos</Link>
            </nav>        
        </>
    );
};

export default SidebarContent;