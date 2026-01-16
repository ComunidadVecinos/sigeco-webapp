//Componente principal que monta toda la aplicación

import React from 'react';
import {Routes, Route} from 'react-router-dom';

import LandingPage from './pages/LandingPage/LandingPage';
import WelcomePage from './pages/WelcomePage/WelcomePage';
import RegisterPage from './pages/RegisterPage/RegisterPage';
import LogInPage from './pages/LogInPage/LogInPage';
import ForgotPassword from './pages/ForgotPassword/ForgotPassword';
import ProfilePage from './pages/ProfilePage/ProfilePage';


const App: React.FC = () => {
    return (
        <div className="App">
            <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/acceso" element={<WelcomePage />} /> 
                <Route path="/registro" element={<RegisterPage />} />
                <Route path="/inicio-sesion" element={<LogInPage />} />
                <Route path="/olvido-contraseña" element={<ForgotPassword />} />
                <Route path='/perfil' element={<ProfilePage />} />
            </Routes>
        </div>
    );
};

export default App;