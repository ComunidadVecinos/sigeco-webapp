//Componente principal que monta toda la aplicación

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


const App: React.FC = () => {
    
    return (
        <AuthProvider>
            <div className="App">
                <Routes>
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/access" element={<WelcomePage />} /> 
                    <Route path="/auth/register" element={<RegisterPage />} />
                    <Route path="/auth/login" element={<LogInPage />} />
                    <Route path="/auth/reset-password" element={<ForgotPasswordPage />} />
                    <Route path="/auth/change-password" />
                    <Route path="/auth/me" element={<ProfilePage />} />
                    <Route path="/auth/forum" element={<ForumPage />} />
                    <Route path="/auth/logout" />
                    <Route path="/auth/delete-account" />
                    <Route path="/auth/new-community" element={<NewCommunityPage />}/>
                    <Route path='/admin' element={<AdminPage/>}/>
                    <Route path='/help' element={<HelpPage/>}></Route>
                </Routes>
            </div>
        </AuthProvider>
    );
};

export default App;
