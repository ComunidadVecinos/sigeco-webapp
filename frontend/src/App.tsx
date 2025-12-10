//Componente principal que monta toda la aplicación

import React from 'react';
import {Routes, Route} from 'react-router-dom';

import LandingPage from './pages/LandingPage/LandingPage.tsx';

const App: React.FC = () => {
    return (
        <div className="App">
            <Routes>

                <Route path="/" element={<LandingPage />} /> {/* UC-01  */}
                
            </Routes>
        </div>
    );
};

export default App;