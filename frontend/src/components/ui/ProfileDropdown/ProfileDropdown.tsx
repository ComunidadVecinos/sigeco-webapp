import React from 'react';
import { useNavigate } from 'react-router-dom';
import './ProfileDropdown.css';

interface ProfileDropdownProps{
    isOpen: boolean;
    onClose: () => void;
    onLogout: () => void;
}

const ProfileDropdown: React.FC<ProfileDropdownProps> = ({isOpen, onClose, onLogout}) => {
    const navigate = useNavigate();

    if(!isOpen) return null;

    return (
        <>
            <div className="dropdown-overlay" onClick={onClose}></div>
            <div className="profile-dropdown">
                <button className="profile-dropdown-item" onClick={() => {navigate('/api/auth/me'); onClose();}}>
                    Ajustes de perfil
                </button>
                <button className="profile-dropdown-item" onClick={onLogout}>
                    Cerrar sesión
                </button>
            </div>
        </>
    );
};

export default ProfileDropdown;