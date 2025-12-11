//Componente principal que monta toda la aplicación

import React from 'react';
import {Routes, Route} from 'react-router-dom';

import LandingPage from './pages/LandingPage/LandingPage';
import WelcomePage from './pages/WelcomePage/WelcomePage';

const App: React.FC = () => {
    return (
        <div className="App">
            <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/acceso" element={<WelcomePage />} /> 
            </Routes>
        </div>
    );
};

export default App;