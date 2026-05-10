//La barra de navegacion con el logo, buscador, selector de comunidad, menú de perfil y sidebar

import React, { useState } from 'react';
import logo from '../../../assets/images/2.png';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import ProfileDropdown from '../../ui/ProfileDropdown/ProfileDropdown';
import LogoutModal from '../../ui/LogoutModal/LogoutModal';
import CommunitiesDropdown from '../../ui/CommunitiesDropdown/CommunitiesDropdown';
import Sidebar from '../../ui/Sidebar/Sidebar';
import { Input } from '@/components/ui/input';
import { Building2, CircleUserRound, Menu } from 'lucide-react';
import { useAuth } from '@/context/authContext';
import { setActiveCommunity } from '@/services/communityServices';

interface HeaderLink {
    label: React.ReactNode;
    path: string;
    onClick?: () => void;
}

interface HeaderProps {
    showCommunutySwitcher?: boolean;
    navLinks: HeaderLink[];
}

const Header: React.FC<HeaderProps> = ({ showCommunutySwitcher: _showCommunutySwitcher = false, navLinks }) => {
    const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
    const [logoutModalOpen, setLogoutModalOpen] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [communitiesDropdownOpen, setCommunitiesDropdownOpen] = useState(false);

    const navigate = useNavigate();
    const location = useLocation();
    const { user, refreshUser, logout } = useAuth();

    const communities = user?.communities || [];
    const activeCommunityId = user?.activeCommunityId || null;
    const hasCommunities = communities.length > 0;
    const shouldShowCommunitySwitcher = hasCommunities;
    const activeCommunity = communities.find((community: any) => community.communityId === activeCommunityId);
    const isAdmin = activeCommunity?.role === 'PRESIDENT' || activeCommunity?.role === 'VICE_PRESIDENT';

    const headerLinks: HeaderLink[] = user
        ? (
            hasCommunities
                ? [
                    { label: <><Menu className="h-4 w-4 inline mr-1" /> Comunidad</>, path: '#', onClick: () => setSidebarOpen(true) },
                    { label: 'Calendario', path: '/calendar' },
                    ...(isAdmin ? [{ label: 'Administración', path: '/admin' }] : []),
                    { label: 'Ayuda', path: '/help' }
                ]
                : [
                    { label: 'Nueva Comunidad', path: '/auth/new-community' },
                    { label: 'Ayuda', path: '/help' }
                ]
        )
        : navLinks;

    //Cambia la comunidad activa y redirige si el usuario pierde permisos de admin
    const handleSelectCommunity = async (id: string) => {
        if (id === activeCommunityId) {
            setCommunitiesDropdownOpen(false);
            return;
        }

        try {
            await setActiveCommunity(id);
            const refreshedUser = await refreshUser();
            const nextCommunity = refreshedUser?.communities?.find((community: any) => community.communityId === id);
            const nextIsAdmin = nextCommunity?.role === 'PRESIDENT' || nextCommunity?.role === 'VICE_PRESIDENT';

            if (location.pathname === '/admin' && !nextIsAdmin) {
                navigate('/auth/me');
                return;
            }

            navigate(`${location.pathname}${location.search}${location.hash}`);
        } catch (err) {
            console.error('Error al cambiar comunidad', err);
        }
    };

    return (
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
                            <Input type="search" placeholder="Búsqueda en toda la comunidad..." />
                        </div>

                        <div className="ml-auto flex items-center">
                            {shouldShowCommunitySwitcher && (
                                <div className="relative">
                                    <button
                                        className="p-1 mr-3 hover:opacity-80 transition-opacity"
                                        onClick={() => setCommunitiesDropdownOpen(!communitiesDropdownOpen)}
                                    >
                                        <Building2 className="h-8 w-8 text-[#104084]" />
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
                                <button
                                    className="p-1 mr-5 hover:opacity-80 transition-opacity"
                                    onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                                >
                                    <CircleUserRound className="h-8 w-8 text-[#104084]" />
                                </button>
                                <ProfileDropdown
                                    isOpen={profileDropdownOpen}
                                    onClose={() => setProfileDropdownOpen(false)}
                                    onLogout={() => {
                                        setProfileDropdownOpen(false);
                                        setLogoutModalOpen(true);
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    <hr className="w-full" />

                    <div className="flex w-full justify-start ml-5">
                        <ul className="flex flex-row list-none gap-3">
                            {headerLinks.map((link, index) => (
                                <li key={index}>
                                    {link.onClick ? (
                                        <span
                                            onClick={link.onClick}
                                            className="font-bold text-[#104084] cursor-pointer relative hover:after:w-full after:content-[''] after:absolute after:left-0 after:bottom-[-4px] after:w-0 after:h-0.5 after:bg-[#104084] after:transition-all"
                                        >
                                            {link.label}
                                        </span>
                                    ) : (
                                        <Link
                                            to={link.path}
                                            className="font-bold text-[#104084] relative hover:after:w-full after:content-[''] after:absolute after:left-0 after:bottom-[-4px] after:w-0 after:h-0.5 after:bg-[#104084] after:transition-all"
                                        >
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
                onConfirm={async () => { await logout(); setLogoutModalOpen(false); navigate('/'); }}
            />

            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        </header>
    );
};

export default Header;