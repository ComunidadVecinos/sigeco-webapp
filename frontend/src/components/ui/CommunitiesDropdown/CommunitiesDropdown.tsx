import React from 'react';
import {Check} from 'lucide-react';

interface Community{
    communityId: string;
    name: string;
}

interface CommunitiesDropdownProps{
    isOpen: boolean;
    onClose: () => void;
    communities: Community[];
    activeCommunityId: string | null;
    onSelectCommunity: (id: string) => void;
}

const CommunitiesDropdown: React.FC<CommunitiesDropdownProps> = ({isOpen, onClose, communities, activeCommunityId, onSelectCommunity}) => {
    if(!isOpen) return null;

    return (
        <>
            <div className="fixed inset-0 z-[999]" onClick={onClose}></div>
            <div className="absolute top-full right-0 bg-white rounded-lg shadow-[0_4px_12px_rgba(0,0,0,0.15)] z-[1000] min-w-[220px] py-2">
                <div className="px-4 py-2 border-b border-gray-100">
                    <span className="text-gray-500 text-sm ml-3">Mis comunidades</span>
                </div>
                {communities.map((community) => (
                    <button key={community.communityId} className={`flex items-center justify-between w-full px-4 py-3 bg-transparent border-none border-b border-gray-100 text-gray-500 text-left cursor-pointer transition-colors hover:bg-gray-50 last:border-b-0 ${community.communityId === activeCommunityId ? 'bg-blue-50' : ''}`} onClick={() => {onSelectCommunity(community.communityId); onClose();}}>
                        <span className="font-medium">{community.name}</span>
                        {community.communityId === activeCommunityId && (<Check className='h-4 w-4 text-[#104084]'/>)}
                    </button>
                ))}
            </div>
        </>
    );
};

export default CommunitiesDropdown;