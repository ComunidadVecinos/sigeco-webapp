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


const App: React.FC = () => {
    return (
        <div className="App">
            <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/access" element={<WelcomePage />} /> 
                <Route path="/api/auth/register" element={<RegisterPage />} />
                <Route path="/api/auth/login" element={<LogInPage />} />
                <Route path="/api/auth/reset-password" element={<ForgotPasswordPage />} />
                <Route path="api/auth/change-password" />
                <Route path="/api/auth/me" element={<ProfilePage />} />
                <Route path="/api/auth/forum" element={<ForumPage />} />
                <Route path="api/auth/logout" />
                <Route path="api/auth/delete-account" />
            </Routes>
        </div>
    );
};

export default App;