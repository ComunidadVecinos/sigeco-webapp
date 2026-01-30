//La barra de navegacion con el logo y el boton de acceso

import React, {useState} from 'react';
import logo from '../../../assets/images/2.png';
import {Link, useNavigate} from 'react-router-dom';
import ProfileDropdown from '../../ui/ProfileDropdown/ProfileDropdown';
import LogoutModal from '../../ui/LogoutModal/LogoutModal';
import CommunitiesDropdown from '../../ui/CommunitiesDropdown/CommunitiesDropdown';

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
    const [activeCommunityId, setActiveCommunityId] = useState(1);
    const [communities] = useState([
        {id: 1, name: 'Los Robledales'},
        {id: 2, name: 'Residencial Norte'}
    ]);


    return(
        <header className="header-common">
            <nav className="navbar bg-body-tertiary flex-column">
                <div className="container-fluid d-flex flex-column">

                    <div className="d-flex w-100 align-items-center mb-2">
                        <div className="me-auto">
                            <Link to="/" className="navbar-brand">
                                <img src={logo} alt="Sigeco" className="img-logo" />
                            </Link>
                        </div>

                        <div className="flex-grow-1 mx-3">
                            <form className="d-flex" role="search">
                                <input className="form-control me-2" type="search" placeholder="Busqueda en toda la Comunidad..." aria-label="Search"/>
                            </form>
                        </div>

                        <div className="ms-auto d-flex align-items-center">
                            {showCommunutySwitcher && (
                                <div className="position-relative">
                                    <button className='btn btn-perfil me-3' onClick={() => setCommunitiesDropdownOpen(!communitiesDropdownOpen)}>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" fill="#104084" className="bi bi-building-fill" viewBox="0 0 16 16"><path d="M3 0a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h3v-3.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5V16h3a1 1 0 0 0 1-1V1a1 1 0 0 0-1-1zm1 2.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5zm3 0a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5zm3.5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5M4 5.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5zM7.5 5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5m2.5.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5zM4.5 8h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5m2.5.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5zm3.5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5"/></svg>
                                    </button>
                                    <CommunitiesDropdown
                                        isOpen={communitiesDropdownOpen}
                                        onClose={() => setCommunitiesDropdownOpen(false)}
                                        communities={communities}
                                        activeCommunityId={activeCommunityId}
                                        onSelectCommunity={(id) => setActiveCommunityId(id)}
                                    />
                                </div>
                            )}
                            <div className="position-relative">
                                <button className="btn btn-perfil me-5" onClick={() => setProfileDropdownopen(!profileDropdownOpen)}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" fill="#104084" className="bi bi-person-circle" viewBox="0 0 16 16"><path d="M11 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0"/><path fill-rule="evenodd" d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8m8-7a7 7 0 0 0-5.468 11.37C3.242 11.226 4.805 10 8 10s4.757 1.225 5.468 2.37A7 7 0 0 0 8 1"/></svg>
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

                    <hr className="w-100 me-5" />

                    <div className="d-flex w-100 justify-content-start ms-5">
                        <ul className="navbar-nav flex-row">
                            {navLinks.map((link, index) => (
                                <li key={index} className='nav-item me-3'>
                                    {link.onClick ? (
                                        <span onClick={link.onClick} className="navbar-brand enlaces-navbar">
                                            {link.label}
                                        </span>
                                        ):(<Link to={link.path} className='navbar-brand enlaces-navbar'>
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