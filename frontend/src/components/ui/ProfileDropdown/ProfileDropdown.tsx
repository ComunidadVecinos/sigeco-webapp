//Menú desplegable del perfil de usuario: acceso a ajuste y cierre de sesión
import React from 'react';
import { useNavigate } from 'react-router-dom';

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
            {/*Capa invisible que cubre toda la pantalla para cerrar al hacer clic fuera*/}
            <div className="fixed inset-0 z-[999]" onClick={onClose}></div>
            <div className="absolute top-full right-0 bg-white rounded-lg shadow-[0_4px_12px_rgba(0,0,0,0.15)] z-[1000] min-w-[180px] py-2">
                <button className="block w-full px-4 py-2.5 bg-transparent border-none border-b border-gray-100 text-gray-500 text-left cursor-pointer transition-colors hover:bg-gray-50" onClick={() => {navigate('/auth/me'); onClose();}}>
                    Ajustes de perfil
                </button>
                <button className="block w-full px-4 py-2.5 bg-transparent border-none text-gray-500 text-left cursor-pointer transition-colors hover:bg-gray-50" onClick={onLogout}>
                    Cerrar sesión
                </button>
            </div>
        </>
    );
};

export default ProfileDropdown;