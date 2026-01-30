import React, {useState} from 'react';
import {Link, useNavigate}  from 'react-router-dom';
import Header from '../../components/common/Header/Header';
import imagen_generica from '../../assets/images/perfil_generico.png'
import 'bootstrap-icons/font/bootstrap-icons.css';
import EditProfileModal from '../../components/ui/EditProfileModal/EditProfileModal';
import EditPhotoModal from '../../components/ui/EditPhotoModal/EditPhotoModal';
import EditPasswordModal from '../../components/ui/EditPasswordModal/EditPasswordModal';
import LogoutModal from '../../components/ui/LogoutModal/LogoutModal';
import DeleteAccountModal from '../../components/ui/DeleteAccountModal/DeleteAccountModal';


const ProfilePage: React.FC = () =>{

    //Atributos modal de editar perfil
    const [modalOpen, setModalOpen] = useState(false);
    const [userData, setUserData] = useState({
        nombre: 'Antonio',
        apellidos: 'Rodriguez Pinedo',
        telefono: '+34 612 345 678',
        email: 'arodrinedo@email.com'
    });

    //Atributos modal de editar photo
    const [photoModalOpen, setPhotoModalOpen] = useState(false);
    const [profilePhoto, setProfilePhoto] = useState(imagen_generica);

    //Atributos de cambiar contraseña
    const [passwordModalOpen, setPasswordModalOpen] = useState(false);
    const [userPassword, setUserPassword] = useState('123456');

    //Atributos modal cerrar sesion
    const [logoutModalOpen, setLogoutModalOpen] = useState(false);

    //Atributos modal eliminar cuenta
    const [deleteAccountModalopen, setDeleteAccountModalOpen] = useState(false);

    const navigate = useNavigate();

    return (

        <div>
            <Header
                navLinks={[
                    {label: "Nueva Comunidad", path: "/api/auth/new-community"},
                    {label: "Ayuda", path: "/help"}
                ]}
             />

            <main className="container">
                <h2 className='titulo-perfil'>Mi Perfil</h2>
                <p className='parrafo-perfil'>Gestiona tu información personal, de tus comunidades y la configuración de tu cuenta.</p>

                <div className="contorno row d-flex justify-content-center mt-5 p-3">
                    <div className="col-6">
                        <h4 className='fw-bold'>Información Personal</h4>
                    </div>
                    <div className="col-6 text-end">
                        <button onClick={() => setModalOpen(true)} className='btn btn-outline-primary btn-sm'><i className="bi bi-pencil-square"></i>  Editar</button>
                    </div>

                    <p className='p-info-comunidad ps-5'>Datos personales: tu nombre, email, telefono, y foto de perfil</p>

                    <div className="row align-items-center mt-3">
                        <div className="col-6">
                            <div className=" text-start mt-4 ms-5 pb-3">
                                <div className="position-relative d-inline-block">
                                    <img className="imagenPerfil" src={profilePhoto} alt="Imagen del perfil"/>
                                    <button onClick={() => setPhotoModalOpen(true)} className="cambiarFoto btn btn-primary position-absolute bottom-0 end-0 rounded-circel d-flex align-items-center justify-content-center p-2">
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
                                <div className="col-6"><h6 className='fw-bold'>Correo electrónico</h6> arodrinedo@email.com</div>
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
                            <Link to="/api/auth/new-community" className="btnAñadirComunidad btn btn-dark rounded-circle d-flex align-items-center justify-content-center">
                                <i className="bi bi-plus-lg fs-4"></i>
                            </Link>
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
                            <button onClick={() => setPasswordModalOpen(true)} className='btn btn-outline-primary'>
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

                <div>
                    <h4 className='fw-bold'>Acciones rápidas</h4>
                    <div className="row">
                        <button className='btn btn-action text-start ms-5' onClick={() => setLogoutModalOpen(true)}><i className='bi bi-box-arrow-left me-2'></i>Cerrar Sesión</button>
                        <button className='btn btn-action text-start ms-5' onClick={() => setDeleteAccountModalOpen(true)}><i className='bi bi-trash me-2'></i>Eliminar permanentemente mi cuenta</button>
                    </div>
                </div>
                
            </main>


                <EditProfileModal
                    isOpen={modalOpen}
                    onClose={() => setModalOpen(false)}
                    initialData={userData}
                    onSave={(data) => setUserData(data)}
                />

                <EditPhotoModal
                    isOpen={photoModalOpen}
                    onClose={() => setPhotoModalOpen(false)}
                    currentPhoto={profilePhoto}
                    onSave={(newPhoto) => setProfilePhoto(newPhoto)}
                />

                <EditPasswordModal
                    isOpen={passwordModalOpen}
                    onClose={() => setPasswordModalOpen(false)}
                    currentPasswordCheck={(password) => password === userPassword}
                    onSave={(newPassword) => {
                        setUserPassword(newPassword);
                        alert('Contraseña cambiada correctamente');
                    }}
                />

                <LogoutModal
                    isOpen={logoutModalOpen}
                    onClose={() => setLogoutModalOpen(false)}
                    onConfirm={() => {
                        setLogoutModalOpen(false);
                        navigate('/');
                    }}
                />

                <DeleteAccountModal
                    isOpen={deleteAccountModalopen}
                    onClose={() => setDeleteAccountModalOpen(false)}
                    onConfirm={() => {
                        setDeleteAccountModalOpen(false);
                        navigate('/');
                    }}
                />

        </div>
    );


};


export default ProfilePage;

