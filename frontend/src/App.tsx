/*
  Componente raíz de la aplicación.
  Aquí se definen todas las rutas de SIGECO y envuelve la aplicación con el AuthProvider para gestionar la autenticación global.
*/
import React from 'react';
import {Routes, Route} from 'react-router-dom';
import LandingPage from './pages/LandingPage/LandingPage';
import WelcomePage from './pages/WelcomePage/WelcomePage';
import RegisterPage from './pages/RegisterPage/RegisterPage';
import LogInPage from './pages/LogInPage/LogInPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage/ForgotPasswordPage';
import ProfilePage from './pages/ProfilePage/ProfilePage';
import ForumPage from './pages/ForumPage/ForumPage';
import NewCommunityPage from './pages/NewCommunityPage/NewCommunityPage';
import AdminPage from './pages/AdminPage/AdminPage';
import { AuthProvider } from './context/authContext';
import HelpPage from './pages/HelpPage/HelpPage';
import NewsPage from './pages/NewsPage/NewsPage';
import CalendarPage from './pages/CalendarPage/CalendarPage';
import NotFoundPage from './pages/NotFoundPage/NotFoundPage';
import DocumentsPage from './pages/DocumentsPage/DocumentsPage';
import VotingPage from './pages/VotingPage/VotingPage';
import IncidentPage from './pages/IncidentPage/IncidentPage';
import ReservationsPage from './pages/ReservationsPage/ReservationPage';
import SpaceManagementPage from './pages/SpaceManagementPage/SpaceManagementPage';

const App: React.FC = () => {
    
    return (
        <AuthProvider>
            <div className="App">
                <Routes>
                    {/*Rutas públicas (landing y acceso)*/}
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/access" element={<WelcomePage />} /> 

                    {/*Rutas de autenticación*/}
                    <Route path="/auth/register" element={<RegisterPage />} />
                    <Route path="/auth/login" element={<LogInPage />} />
                    <Route path="/auth/reset-password" element={<ForgotPasswordPage />} />
                    <Route path="/auth/change-password" />
                    <Route path="/auth/me" element={<ProfilePage />} />
                    <Route path="/auth/logout" />
                    <Route path="/auth/delete-account" />
                    <Route path="/auth/new-community" element={<NewCommunityPage />}/>

                    {/*Rutas de módulos de la comunidad*/}
                    <Route path="/forum" element={<ForumPage />} />
                    <Route path='/admin' element={<AdminPage/>}/>
                    <Route path='/help' element={<HelpPage/>}/>
                    <Route path='/news' element={<NewsPage/>}/>
                    <Route path='/calendar' element={<CalendarPage/>}/>
                    <Route path='/documents' element={<DocumentsPage/>}/>
                    <Route path='/voting' element={<VotingPage/>}/>
                    <Route path='/incidents' element={<IncidentPage/>} />
                    <Route path='/reservations' element={<ReservationsPage/>} />
                    <Route path='/space-management' element={<SpaceManagementPage/>} />

                    {/*Rutas para páginas no encontradas*/}
                    <Route path="*" element={<NotFoundPage />} />
                </Routes>
            </div>
        </AuthProvider>
    );
};

export default App;
