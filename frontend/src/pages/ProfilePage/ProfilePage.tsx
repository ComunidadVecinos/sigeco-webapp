import React, {useState} from 'react';
import {Link, useNavigate}  from 'react-router-dom';
import Header from '../../components/common/Header/Header';
import imagen_generica from '../../assets/images/perfil_generico.png'
import EditProfileModal from '../../components/ui/EditProfileModal/EditProfileModal';
import EditPhotoModal from '../../components/ui/EditPhotoModal/EditPhotoModal';
import EditPasswordModal from '../../components/ui/EditPasswordModal/EditPasswordModal';
import LogoutModal from '../../components/ui/LogoutModal/LogoutModal';
import DeleteAccountModal from '../../components/ui/DeleteAccountModal/DeleteAccountModal';
import { useAuth } from '../../context/authContext';
import { changePassword } from '../../services/authServices';
import { Button } from '@/components/ui/button';
import {Pencil, Camera, ChevronRight, LogOut, Trash2, Plus} from 'lucide-react';

const ProfilePage: React.FC = () =>{

    const {user, logout, refreshUser} = useAuth();

    //Atributos modal de editar perfil
    const [modalOpen, setModalOpen] = useState(false);

    //Atributos modal de editar photo
    const [photoModalOpen, setPhotoModalOpen] = useState(false);
    const [profilePhoto, setProfilePhoto] = useState(imagen_generica);

    //Atributos de cambiar contraseña
    const [passwordModalOpen, setPasswordModalOpen] = useState(false);

    //Atributos modal cerrar sesion
    const [logoutModalOpen, setLogoutModalOpen] = useState(false);

    //Atributos modal eliminar cuenta
    const [deleteAccountModalopen, setDeleteAccountModalOpen] = useState(false);

    const navigate = useNavigate();

    return (

        <div>
            <Header
                navLinks={[
                    {label: "Nueva Comunidad", path: "/auth/new-community"},
                    {label: "Ayuda", path: "/help"}
                ]}
             />

            <main className="max-w-5xl mx-auto px-4">
                <h2 className='text-3xl font-bold mt-35 text-gray-900'>Mi Perfil</h2>
                <p className='text-gray-500 mb-8'>Gestiona tu información personal, de tus comunidades y la configuración de tu cuenta.</p>

                <div className="border border-gray-200 rounded-2xl bg-white shadow-sm p-4 mt-5">
                    <div className="flex justify-between items-center">
                        <h4 className='font-bold'>Información Personal</h4>
                        <Button variant="outline" size="sm" onClick={() => setModalOpen(true)}>
                            <Pencil className='h-4 w-4 mr-1'/>Editar
                        </Button>
                    </div>

                    <p className='text-sm text-gray-500 pl-4 mt-1'>Datos personales: tu nombre, email, telefono, y foto de perfil</p>

                    <div className="flex flex-col md:flex-row items-center mt-4 gap-6">
                        <div className="text-center">
                            <div className="relative inline-block">
                                <img className="rounded-full border-3 border-gray-200 w-44 h-44 md:w-36 md:h-36 object-cover" src={profilePhoto} alt="Imagen del perfil"/>

                                <button onClick={() => setPhotoModalOpen(true)} className="absolute bottom-1 right-1 bg-primary text-primary-foreground rounded-full p-2 hover:opacity-90 transition-opacity">
                                    <Camera className="h-4 w-4"/>
                                </button>
                            </div>
                        </div>
  
                        <div className="grid grid-cols-2 gap-4 flex-1">
                            <div><h6 className='font-bold text-sm'>Nombre</h6><span className='text-sm'>{user?.firstName  + ' ' +  user?.lastName}</span></div>
                            <div><h6 className='font-bold text-sm'>Telefono</h6><span className='text-sm'>{user?.phone}</span></div>
                            <div><h6 className='font-bold text-sm'>Correo electrónico</h6><span className='text-sm'>{user?.email}</span></div>
                        </div>
                    </div>
                </div>

                <div className="border border-gray-200 rounded-2xl bg-white shadow-sm p-4 mt-5">
                    <h4 className='font-bold'>Información de tus comunidades</h4>
                    <div className="border border-gray-200 rounded-2xl mx-4 mt-3 p-4">
                        <h5 className='font-bold'>Crea o únete a una comunidad</h5>
                        <p className='text-sm text-gray-500 leading-relaxed mt-2'>¡Esto está muy vacío! Para acceder a todo lo que SIGECO puede ofrecer, solicita unirte o crea tú mismo tu propia comunidad. Para ello, ten en cuenta que: </p>

                        <p className="text-sm text-gray-500 leading-relaxed mt-2"> <span className='font-bold ml-4'>1. Unirse a una comunidad.</span> Para unirte a una comunidad, necesitarás un código de acceso. Puedes solicitarle uno a cualquiera de los administradores de tu comunidad (presidente y/o vicepresidente).</p>

                        <p className="text-sm text-gray-500 leading-relaxed mt-2"> <span className='font-bold ml-4'>2. Crear una comunidad.</span> Al crear la comunidad deberás introducir algunos datos, ¡así que ténlos a mano! Además, pasarás a ser automáticamente el administrador de la comunidad (presidente).</p>

                        <p className='text-sm text-gray-500 leading-relaxed mt-2 ml-8 font-bold'>2.1 Este rol es transferible, por lo que llegado el momento podrás transferir sin problemas la responsabilidad.</p>
                    </div>

                    <div className="flex justify-center mt-4">
                        <Link to="/auth/new-community" className="bg-gray-900 text-white rounded-full w-12 h-12 flex items-center justify-center hover:scale-110 transition-transform">
                            <Plus className="h-5 w-5"/>
                        </Link>
                    </div>
                </div>

                <div className="border border-gray-200 rounded-2xl bg-white shadow-sm p-4 mt-5">

                    <h4 className='font-bold mb-2'>Configuración de la cuenta</h4>

                    <p className='text-sm text-gray-500 mb-4'>Cambia tu contraseña y gestiona tus notificaciones</p>
                    
                    <div className="flex justify-between items-center py-4 border-b border-gray-100">
                        <div>
                            <h5 className='font-bold text-base'>Cambiar contraseña</h5>
                            <p className="text-sm text-gray-500">Se recomienda actualizar la contraseña periódicamente.</p>
                        </div>
                        
                        <Button variant="outline" size="sm" onClick={() => setPasswordModalOpen(true)}>
                            <ChevronRight className="h-4 w-4"/>
                        </Button>
                    </div>
                    
                    <div className="flex justify-between items-center py-4">
                        <div>
                            <h5 className='font-bold text-base'>Gestionar notificaciones</h5>
                            <p className="text-sm text-gray-500">Modificar tus preferencias para recibir notificaciones.</p>
                        </div>
                    

                        <Button variant="outline" size="sm">
                            <ChevronRight className="h-4 w-4"/>
                        </Button>
                    </div>
                </div>

                <div className='mt-5 mb-100'>
                    <h4 className='font-bold mb-3'>Acciones rápidas</h4>
                    <div className="flex flex-col gap-1">
                        <button className='text-left text-gray-500 text-sm py-2 hover:text-[#104084]        transition-colors' onClick={() => setLogoutModalOpen(true)}>
                            <LogOut className='h-4 w-4 inline mr-2'/>Cerrar Sesión
                        </button>
                        <button className='text-left text-red-500 text-sm py-2 hover:text-red-700 transition-colors' onClick={() => setDeleteAccountModalOpen(true)}>
                            <Trash2 className='h-4 w-4 inline mr-2'/>Eliminar permanentemente mi cuenta
                        </button>
                    </div>
                </div>
                
            </main>


                <EditProfileModal
                    isOpen={modalOpen}
                    onClose={() => setModalOpen(false)}
                    initialData={{
                        nombre: user?.firstName || '',
                        apellidos: user?.lastName || '',
                        telefono: user?.phone || '',
                        email: user?.email || ''
                    }}
                    onSave={async (data) =>{
                        await refreshUser();
                    }}
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
                    currentPasswordCheck={(password) => Boolean(password.trim())}
                    onSave={async (currentPassword, newPassword) => {
                        try{
                            await changePassword(currentPassword, newPassword, newPassword);
                            alert('Contraseña cambiada correctamente');
                        }
                        catch(error: any){
                            alert(error.response?.data?.message || 'Error al cambiar la contraseña');
                        }
                        
                    }}
                />

                <LogoutModal
                    isOpen={logoutModalOpen}
                    onClose={() => setLogoutModalOpen(false)}
                    onConfirm={async() => {
                        await logout();
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
