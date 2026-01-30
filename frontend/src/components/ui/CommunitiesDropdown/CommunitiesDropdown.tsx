import React from 'react';
import './CommunitiesDropdown.css';

interface Community{
    id: number;
    name: string;
}

interface CommunitiesDropdownProps{
    isOpen: boolean;
    onClose: () => void;
    communities: Community[];
    activeCommunityId: number;
    onSelectCommunity: (id: number) => void;
}

const CommunitiesDropdown: React.FC<CommunitiesDropdownProps> = ({isOpen, onClose, communities, activeCommunityId, onSelectCommunity}) => {
    if(!isOpen) return null;

    return (
        <>
            <div className="dropdown-overlay" onClick={onClose}></div>
            <div className="communities-dropdown">
                <div className="dropdown-header">
                    <span className="text-muted small">Mis comunidades</span>
                </div>
                {communities.map((community) => (
                    <button key={community.id} className={`community-item ${community.id === activeCommunityId ? 'active' : ''}`} onClick={() => {onSelectCommunity(community.id); onClose();}}>
                        <span className="community-name">{community.name}</span>
                        {community.id === activeCommunityId && (<i className='bi bi-check-lg community-check'></i>)}
                    </button>
                ))}
            </div>
        </>
    );
};

export default CommunitiesDropdown;