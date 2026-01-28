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

            <main>
                <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)}></Sidebar>
            </main>
        </div>
    );


};


export default ForumPage;

