import React from 'react';
import Header from '../../components/common/Header/Header';
import imgSD from '../../assets/images/SwingingDoodle.png'
import 'bootstrap-icons/font/bootstrap-icons.css';


const ProfilePage: React.FC = () =>{
    return (
        <div>
            <Header
                navLinks={[
                    {label: "Nueva Comunidad", path: "/new-community"},
                    {label: "Ayuda", path: "/help"}
                ]}
             />

            <main className="container">
                <h2 className='titulo-perfil'>Mi Perfil</h2>
                <p>Gestiona tu información personal, de tus comunidades y la configuración de tu cuenta.</p>

                <div className="contorno row d-flex justify-content-center mt-5 p-3">
                    <div className="col-6">
                        <h4 className='fw-bold'>Información Personal</h4>
                    </div>
                    <div className="col-6 text-end">
                        <button className='btn btn-outline-primary btn-sm'><i className="bi bi-pencil-square"></i>  Editar</button>
                    </div>

                    <p className='p-info-comunidad ps-5'>Datos personales: tu nombre, email, telefono, y foto de perfil</p>

                    <div className="row align-items-center mt-3">
                        <div className="col-6">
                            <div className=" text-center mt-4 ">
                                <div className="position-relative d-inline-block">
                                    <img className="imagenPerfil" src={imgSD} alt="Imagen del perfil"/>
                                    <button className="cambiarFoto btn btn-primary position-absolute bottom-0 end-0 rounded-circel d-flex align-items-center justify-content-center p-2">
                                        <i className="bi bi-camera-fill"></i>
                                    </button>
                                </div>
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

                <div className="contorno row d-flex justify-content-center mt-5 p-3">
                    <div className="col-6">
                        <h4 className='fw-bold'>Información de tus comunidades</h4>
                    </div>
                    <div className="col-6 text-end">
                    </div>

                    <div className="contorno row align-items-center ms-5 me-5 mb-3">
                        <h5 className='pt-3 ps-5 fw-bold'>Crea o únete a una comunidad</h5>
                        <div className='ps-4'>
                            <p className='p-info-comunidad ps-5'>¡Esto está muy vacío! Para acceder a todo lo que SIGECO puede ofrecer, solicita unirte o crea tú mismo tu propia comunidad. Para ello, ten en cuenta que: </p>

                            <p className="p-info-comunidad ps-5"> <span className='ps-5 fw-bold'>1. Unirse a una comunidad.</span> Para unirte a una comunidad, necesitarás un código de acceso. Puedes solicitarle uno a cualquiera de los administradores de tu comunidad (presidente y/o vicepresidente).</p>

                            <p className="p-info-comunidad ps-5"> <span className='ps-5 fw-bold'>2. Crear una comunidad.</span> Al crear la comunidad deberás introducir algunos datos, ¡así que ténlos a mano! Además, pasarás a ser automáticamente el administrador de la comunidad (presidente).
                                <br /><p className='p-info-comunidad ps-5 fw-bold mt-4'>     2.1 Este rol es transferible, por lo que llegado el momento podrás transferir sin problemas la responsabilidad.</p></p>
                        </div>
                    </div>

                    <div className="row mt-4 justify-content-center">
                        <div className="col-auto">
                            <button className="btnAñadirComunidad btn btn-dark rounded-circle d-flex align-items-center justify-content-center">
                                <i className="bi bi-plus-lg fs-4"></i>
                            </button>
                        </div>
                    </div>

                </div>

                <div className="contorno row d-flex justify-content-center mt-5 p-3">
                    <div>
                        <h4 className='fw-bold'>Configuración de la cuenta</h4>
                    </div>

                    <p className='p-info-comunidad ps-5'>Cambia tu contraseña y gestiona tus notificaciones</p>
                    
                    <div className="row align-items-center ms-5 me-5 mb-3">
                        <div className="col-6">
                            <h5 className='pt-3 ps-5 fw-bold'>Cambiar contraseña</h5>
                            <p className='p-info-comunidad ps-5'>Se recomienda actualizar la contraseña periódicamente.</p>
                        </div>
                        <div className="col-6">
                            <button className='btn btn-outline-primary'>
                                <i className="bi bi-chevron-right"></i>
                            </button>
                        </div>
                        <div className="col-6">
                            <h5 className='pt-3 ps-5 fw-bold'>Gestionar notificaciones</h5>
                            <p className='p-info-comunidad ps-5'>Modificar tus preferencias para recibir notificaciones.</p>
                        </div>
                        <div className="col-6">
                            <button className='btn btn-outline-primary'>
                                <i className="bi bi-chevron-right"></i>
                            </button>
                        </div>
                        
                    </div>
                </div>

            </main>
        </div>
    );


};


export default ProfilePage;

