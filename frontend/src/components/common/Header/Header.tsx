//La barra de navegacion con el logo y el boton de acceso

import React, {useState} from 'react';
import logo from '../../../assets/images/2.png';
import {Link, useNavigate} from 'react-router-dom';
import ProfileDropdown from '../../ui/ProfileDropdown/ProfileDropdown';
import LogoutModal from '../../ui/LogoutModal/LogoutModal';
import CommunitiesDropdown from '../../ui/CommunitiesDropdown/CommunitiesDropdown';
import { Input } from '@/components/ui/input';
import { Building2, CircleUserRound } from 'lucide-react';
import { useAuth } from '@/context/authContext';
import { setActiveCommunity } from '@/services/communityServices';

interface HeaderLink {
    label: React.ReactNode;
    path: string;
    onClick?: () => void;
}

interface HeaderProps{
    showCommunutySwitcher?: boolean;
    navLinks: HeaderLink[];
}

const Header: React.FC<HeaderProps> = ({showCommunutySwitcher = false, navLinks}) =>{


    const [profileDropdownOpen, setProfileDropdownopen] = useState(false);
    const [logoutModalOpen, setLogoutModalOpen] = useState(false);
    const navigate = useNavigate();

    const [communitiesDropdownOpen, setCommunitiesDropdownOpen] = useState(false);

    const {user, refreshUser} = useAuth();

    const communities = user?.communities || [];
    const activeCommunityId = user?.activeCommunityId || 0;
    const activeCommunity = communities.find((c: any) => c.id === activeCommunityId);
    const isAdmin = activeCommunity?.role === 'PRESIDENT' || activeCommunity?.role === 'VICEPRESIDENT';

    const handleSelectCommunity = async (id:number) => {
        try{
            await setActiveCommunity(id);
            await refreshUser();
        }catch(err){
            console.error('Error al cambiar comunidad', err);
        }
    };

    return(
        <header className="fixed top-0 w-full z-50 bg-white shadow-sm">
            <nav className="flex flex-col">
                <div className="px-4 py-2">

                    <div className="flex w-full items-center mb-2">
                        <div className="mr-auto">
                            <Link to="/">
                                <img src={logo} alt="Sigeco" className="w-36" />
                            </Link>
                        </div>

                        <div className="flex-1 mx-3">
                            <Input type="search" placeholder="Busqueda en toda la Comunidad..." />
                        </div>

                        <div className="ml-auto flex items-center">
                            {showCommunutySwitcher && (
                                <div className="relative">
                                    <button className='p-1 mr-3 hover:opacity-80 transition-opacity' onClick={() => setCommunitiesDropdownOpen(!communitiesDropdownOpen)}>
                                        <Building2 className='h-8 w-8 text-[#104084]'></Building2>
                                    </button>
                                    <CommunitiesDropdown
                                        isOpen={communitiesDropdownOpen}
                                        onClose={() => setCommunitiesDropdownOpen(false)}
                                        communities={communities}
                                        activeCommunityId={activeCommunityId}
                                        onSelectCommunity={handleSelectCommunity}
                                    />
                                </div>
                            )}
                            <div className="relative">
                                <button className="p-1 mr-5 hover:opacity-80 transition-opacity" onClick={() => setProfileDropdownopen(!profileDropdownOpen)}>
                                    <CircleUserRound className="h-8 w-8 text-[#104084]" />
                                </button>
                                <ProfileDropdown
                                    isOpen={profileDropdownOpen}
                                    onClose={() => setProfileDropdownopen(false)}
                                    onLogout={() => {
                                        setProfileDropdownopen(false);
                                        setLogoutModalOpen(true);
                                    }}
                                />
                            </div>
                        </div>

                    </div>

                    <hr className="w-full" />

                    <div className="flex w-full justify-start ml-5">
                        <ul className="flex flex-row list-none gap-3">
                            {isAdmin && (
                                <li>
                                    <Link to="/admin" className="font-bold text-[#104084] relative hover:after:w-full after:content-[''] after:absolute after:left-0 after:bottom-[-4px] after:w-0 after:h-0.5 after:bg-[#104084] after:transition-all">Administración</Link>
                                </li>
                            )}
                            {navLinks.map((link, index) => (
                                <li key={index} >
                                    {link.onClick ? (
                                        <span onClick={link.onClick} className="font-bold text-[#104084] cursor-pointer relative hover:after:w-full after:content-[''] after:absolute after:left-0 after:bottom-[-4px] after:w-0 after:h-0.5 after:bg-[#104084] after:transition-all">
                                            {link.label}
                                        </span>
                                        ):(<Link to={link.path} className="font-bold text-[#104084] relative hover:after:w-full after:content-[''] after:absolute after:left-0 after:bottom-[-4px] after:w-0 after:h-0.5 after:bg-[#104084] after:transition-all">
                                            {link.label}
                                        </Link>
                                    )}
                                    
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </nav>

            <LogoutModal
                isOpen={logoutModalOpen}
                onClose={() => setLogoutModalOpen(false)}
                onConfirm={() => {
                    setLogoutModalOpen(false);
                    navigate('/');
                }}
            />
        </header>
    );
};

export default Header;