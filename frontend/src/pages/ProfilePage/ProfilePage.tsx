import React, {useState, useEffect} from 'react';
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
import {Pencil, Camera, ChevronRight, LogOut, Trash2, Plus, Archive} from 'lucide-react';
import { getMyRequests, archiveRequest } from '@/services/communityServices';

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

    const [solicitudes, setSolicitudes] = useState<any[]>([]);

    const mockCommunities = [
    {
        id: 1,
        name: 'Comunidad Residencial Sol',
        alias: 'Piso 3A - Familia Mourão',
        role: 'PRESIDENT',
        avatar: null,
        streetType: 'Calle',
        streetName: 'Gran Vía',
        number: '12',
        municipality: 'Madrid',
        province: 'Madrid'
    },
    {
        id: 2,
        name: 'Edificio Luna',
        alias: 'Bajo B',
        role: 'MEMBER',
        avatar: null,
        streetType: 'Avenida',
        streetName: 'de la Constitución',
        number: '45',
        municipality: 'Sevilla',
        province: 'Sevilla'
    }
];

const mockSolicitudes = [
    {
        id: 1,
        communityName: 'Comunidad Residencial Sol',
        status: 'PENDING',
        type: 'JOIN',
        alias: 'Piso 3A',
        createdAt: '2026-02-25T10:00:00Z',
        adminMessage: null
    },
    {
        id: 2,
        communityName: 'Edificio Luna',
        status: 'APPROVED',
        type: 'JOIN',
        alias: 'Bajo B',
        createdAt: '2026-02-20T10:00:00Z',
        adminMessage: 'Bienvenido!'
    },
    {
        id: 3,
        communityName: 'Comunidad Residencial Sol',
        status: 'REJECTED',
        type: 'PROFILE_CHANGE',
        alias: null,
        createdAt: '2026-02-18T10:00:00Z',
        adminMessage: 'Datos incorrectos, revisa la dirección.'
    }
];

    const cargarSolicitudes = async () => {
        try{
            const res = await getMyRequests();
            setSolicitudes(Array.isArray(res.data) ? res.data : []);
        }catch(err){
            console.error('Error al cargar solicitudes', err);
        }
    };

    useEffect(() => {
        cargarSolicitudes();
    }, []);

    const handleArchivar = async (requestId: number) => {
        try{
            await archiveRequest(requestId);
            await cargarSolicitudes();
        }catch(err: any){
            alert(err.response?.data?.error?.message || 'Error al archivar solicitud');
        }
    };

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

                    {(!mockCommunities || mockCommunities.length === 0) ? (
                        <div className="border border-gray-200 rounded-2xl mx-4 mt-3 p-4">
                        <h5 className='font-bold'>Crea o únete a una comunidad</h5>
                        <p className='text-sm text-gray-500 leading-relaxed mt-2'>¡Esto está muy vacío! Para acceder a todo lo que SIGECO puede ofrecer, solicita unirte o crea tú mismo tu propia comunidad. Para ello, ten en cuenta que: </p>

                        <p className="text-sm text-gray-500 leading-relaxed mt-2"> <span className='font-bold ml-4'>1. Unirse a una comunidad.</span> Para unirte a una comunidad, necesitarás un código de acceso. Puedes solicitarle uno a cualquiera de los administradores de tu comunidad (presidente y/o vicepresidente).</p>

                        <p className="text-sm text-gray-500 leading-relaxed mt-2"> <span className='font-bold ml-4'>2. Crear una comunidad.</span> Al crear la comunidad deberás introducir algunos datos, ¡así que ténlos a mano! Además, pasarás a ser automáticamente el administrador de la comunidad (presidente).</p>

                        <p className='text-sm text-gray-500 leading-relaxed mt-2 ml-8 font-bold'>2.1 Este rol es transferible, por lo que llegado el momento podrás transferir sin problemas la responsabilidad.</p>
                    </div>
                    ) : (
                        <>
                            <p className="text-sm text-gray-500 mb-4">Comunidades a las que perteneces.</p>

                            <div className="space-y-3">
                                {mockCommunities.map((com: any) => (
                                    <div key={com.id} className='border border-gray-200 rounded-xl p-4 flex items-center gap-4'>
                                        <img src={com.avatar || imagen_generica} alt={com.name} className='w-16 h-16 rounded-full object-cover border-2 border-gray-200' />
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <h5 className="font-bold">{com.name}</h5>
                                                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">{com.role}</span>
                                            </div>
                                            <p className="text-sm text-gray-500 mt-1">Alias: {com.alias}</p>
                                            <p className="text-sm text-gray-500">
                                                {com.streetType} {com.streetName}, {com.number} - {com.municipality}, {com.province}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}

                    <div className="flex justify-center mt-4">
                        <Link to="/auth/new-community" className="bg-gray-900 text-white rounded-full w-12 h-12 flex items-center justify-center hover:scale-110 transition-transform">
                            <Plus className="h-5 w-5"/>
                        </Link>
                    </div>
                </div>

                <div className="border border-gray-200 rounded-2xl bg-white shadow-sm p-4 mt-5">
                    <h4 className="font-bold">Mis solicitudes</h4>
                    <p className="text-sm text-gray-500 mb-4">Historial de tus solicitudes enviadas a comunidades.</p>

                    {mockSolicitudes.length > 0 ? (
                        <div className="space-y-3">
                        {mockSolicitudes.map((sol) => (
                            <div key={sol.id} className="border border-gray-200 rounded-xl p-4 flex justify-between items-start">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-sm">{sol.communityName}</span>
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${sol.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700': sol.status === 'APPROVED' ? 'bg-green-100 text-green-700': 'bg-red-100 text-red-700'}`}>{sol.status === 'PENDING' ? 'Pendiente': sol.status === 'APPROVED' ? 'Aceptada': 'Rechazada'}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-500 mt-1">
                                        {sol.type === 'JOIN' ? 'Solicitud de acceso' : 'Cambio de informacion'}{' - '}{new Date(sol.createdAt).toLocaleDateString('es-ES')}
                                    </p>
                                    {sol.alias && <p className='text-sm text-gray-500 mt-1'>Alias: {sol.alias}</p>}
                                    {sol.adminMessage && (
                                        <p className='text-sm text-gray-600 mt-1 italic'>Respuesta del admin: {sol.adminMessage}</p>
                                    )}
                                </div>
                                <Button variant="outline" size="sm" onClick={() => handleArchivar(sol.id)}>
                                    <Archive className='h-4 w-4 mr-1'/>
                                    {sol.status === 'PENDING' ? 'Cancelar':'Archivar'}
                                </Button>
                            </div>
                        ))}
                    </div>
                    ):(
                        <p className="text-sm text-gray-400 text-center py-6">No tienes solicitudes pendientes ni recientes.</p>
                    )}
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
                    onSave={async (currentPassword, newPassword) => {
                        await changePassword(currentPassword, newPassword, newPassword);
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
                    userEmail={user?.email || ''}
                    onConfirm={async () => {
                        setDeleteAccountModalOpen(false);
                        navigate('/');
                    }}
                />

        </div>
    );


};


export default ProfilePage;
