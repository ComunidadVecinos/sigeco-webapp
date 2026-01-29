import React, {useState} from 'react';
import Header from '../../components/common/Header/Header';
import Sidebar from '../../components/ui/Sidebar/Sidebar';
import 'bootstrap-icons/font/bootstrap-icons.css';


const ForumPage: React.FC = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    
    return (
        <div>
            
            <Header 
                showCommunutySwitcher={true}
                navLinks={[
                    {label: <><i className="bi bi-list"></i> Comunidad</>, path: "#", onClick: () => setSidebarOpen(true)},
                    {label: "Calendario", path: "/calendar"},
                    {label: "Ayuda", path: "/help"}
                ]}
            />
            
                <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)}></Sidebar>

                <main className='container'>
                    <h1 className='fw-bold text-center mt-5'>Foro Comunitario</h1>

                </main>
            
        </div>
    );


};


export default ForumPage;

