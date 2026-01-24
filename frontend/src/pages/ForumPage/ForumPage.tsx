import React from 'react';
import Header from '../../components/common/Header/Header';
import 'bootstrap-icons/font/bootstrap-icons.css';


const ForumPage: React.FC = () =>{
    return (
        <div>
            <Header 
                showCommunutySwitcher={true}
                navLinks={[
                    {label: "Comunidad", path: "/community"},
                    {label: "Calendario", path: "/calendar"},
                    {label: "Ayuda", path: "/help"}
                ]}
            />

            <main>
                <h1 className="mt-5 fw-bold">FORO COMUNITARIO</h1>
            </main>
        </div>
    );


};


export default ForumPage;

