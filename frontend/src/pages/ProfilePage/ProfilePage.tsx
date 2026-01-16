import React from 'react';
import Header from '../../components/common/Header/Header';
import imgSD from '../../assets/images/SwingingDoodle.png'


const ProfilePage: React.FC = () =>{
    return (
        <div>
            <Header />

            <main className="container">
                <h2 className='titulo-perfil'>Mi Perfil</h2>
                <p>Gestiona tu información personal, de tus comunidades y la configuración de tu cuenta.</p>

                <div className="contorno row d-flex justify-content-center mt-5 p-3">
                    <div className="col-6">
                        <h4 className='fw-bold'>Informacion Personal</h4>
                    </div>
                    <div className="col-6 text-end">
                        <button className='btn btn-primary'>Editar</button>
                    </div>

                    <span className='ms-5'>Datos personales: tu nombre, email, telefono, y foto de perfil</span>

                    <div className="row align-items-center mt-3">
                        <div className="col-6">
                            <div className=" text-center mt-4 ">
                                <img className="imagenPerfil" src={imgSD} alt="Imagen del perfil"/>
                            </div>
  
                        </div>
                        <div className="col-6">
                            <div className="row">
                                <div className="col-6"><h6 className='fw-bold'>Nombre</h6> Antonio Rodriguez Pinedo</div>
                                <div className="col-6"><h6 className='fw-bold'>Telefono</h6>+34 612 345 678</div>
                            </div>
                            <div className="row mt-3">
                                <div className="col-6"><h6 className='fw-bold'>Correo electronico</h6> arodrinedo@email.com</div>
                            </div>
                        </div>
                    </div>
                
                </div>

                <div className="contorno d-flex justify-content-center mt-5 p-3">
                    <h4 className='fw-bold '>Informacion de tus Comunidades</h4>
                    
                </div>

            </main>
        </div>
    );


};


export default ProfilePage;

