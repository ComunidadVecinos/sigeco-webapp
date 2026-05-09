//Página de perfil del usuario: información personal, comunidades, solicitudes y configuración de cuenta
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../../components/common/Header/Header';
import imagen_generica from '../../assets/images/perfil_generico.png'
import EditProfileModal from '../../components/ui/EditProfileModal/EditProfileModal';
import EditPhotoModal from '../../components/ui/EditPhotoModal/EditPhotoModal';
import EditPasswordModal from '../../components/ui/EditPasswordModal/EditPasswordModal';
import EditCommunityInfoModal from '../../components/ui/EditCommunityInfoModal/EditCommunityInfoModal';
import LogoutModal from '../../components/ui/LogoutModal/LogoutModal';
import DeleteAccountModal from '../../components/ui/DeleteAccountModal/DeleteAccountModal';
import { useAuth } from '../../context/authContext';
import { changePassword } from '../../services/authServices';
import { deleteAvatar } from '@/services/userServices';
import { Button } from '@/components/ui/button';
import { Pencil, Camera, ChevronRight, LogOut, Trash2, Plus, Archive } from 'lucide-react';
import { getMyRequests, archiveRequest, cancelRequest } from '@/services/communityServices';
import LeaveCommunityModal from '@/components/ui/LeaveCommunityModal/LeaveCommunityModal';
import FeedbackModal from '@/components/ui/FeedbackModal/FeedbackModal';


const ProfilePage: React.FC = () => {

    const navigate = useNavigate();

    const { user, logout, refreshUser } = useAuth();
    //Visibilidad de modales (perfil, foto, contraseña, logout, eliminar cuenta, info comunidad, abandonar)
    const [modalOpen, setModalOpen] = useState(false);
    const [photoModalOpen, setPhotoModalOpen] = useState(false);
    const [profilePhoto, setProfilePhoto] = useState(imagen_generica);
    const [passwordModalOpen, setPasswordModalOpen] = useState(false);
    const [logoutModalOpen, setLogoutModalOpen] = useState(false);
    const [deleteAccountModalopen, setDeleteAccountModalOpen] = useState(false);
    const [communityInfoModal, setCommunityInfoModal] = useState<{ open: boolean; community: any | null }>({ open: false, community: null });
    const [leaveModal, setLeaveModal] = useState<{ open: boolean; communityId: string; name: string }>({ open: false, communityId: '', name: '' });
    //Historial de solicitudes del usuario y feedback global
    const [solicitudes, setSolicitudes] = useState<any[]>([]);
    const [feedback, setFeedback] = useState<{ isOpen: boolean, type: 'success' | 'error', message: string }>({ isOpen: false, type: 'success', message: '' });
    //Cache-busting: fuerza la recarga de la imagen de perfil tras actualizarla
    const [avatarKey, setAvatarKey] = useState(Date.now());

    const closeFeedback = () => setFeedback(prev => ({ ...prev, isOpen: false }));

    //Carga las solicitudes del usuario desde la API
    const cargarSolicitudes = async () => {
        try {
            const res = await getMyRequests();
            setSolicitudes(res.data.items || []);
        } catch (err) {
            console.error('Error al cargar solicitudes', err);
        }
    };

    //Carga las solicitudes al montar el componente
    useEffect(() => {
        cargarSolicitudes();
    }, []);

    //Sincroniza la foto de perfil local con la del contexto de autenticación
    useEffect(() => {
        setProfilePhoto(user?.profileImageUrl || imagen_generica);
    }, [user?.profileImageUrl]);

    //Cancela la solicitud si está pendiente o la archiva si ya fue resuelta
    const handleArchivar = async (requestId: string, status: string) => {
        try {
            if (status === 'PENDING') {
                await cancelRequest(requestId);
            } else {
                await archiveRequest(requestId);
            }
            await cargarSolicitudes();
        } catch (err: any) {
            setFeedback({ isOpen: true, type: 'error', message: err.response?.data?.error?.message || 'Error al archivar solicitud.' });
        }
    };

    //Construye el objeto de domicilio actual a partir de los datos de la comunidad para pasarlo al modal de edición
    const buildCurrentDomicile = (community: any) => {
        const details = community?.addressDetails || {};

        return {
            country: details.country || '',
            province: details.province || '',
            municipality: details.municipality || '',
            streetType: details.streetType || '',
            streetName: details.streetName || '',
            postalCode: details.postalCode || '',
            number: details.streetNumberKm || '',
            block: details.block || '',
            floor: details.floor || '',
            door: details.door || ''
        };
    };

    return (

        <div>
            <Header
                navLinks={[
                    { label: "Nueva Comunidad", path: "/auth/new-community" },
                    { label: "Ayuda", path: "/help" }
                ]}
            />

            <main className="max-w-5xl mx-auto px-4">
                <h2 className='text-3xl font-bold mt-35 text-gray-900'>Mi Perfil</h2>
                <p className='text-gray-500 mb-8'>Gestiona tu información personal, de tus comunidades y la configuración de tu cuenta.</p>

                {/*Sección 1: Información personal - foto con botón de cámara + datos del usuario*/}
                <div className="border border-gray-200 rounded-2xl bg-white shadow-sm p-4 mt-5">
                    <div className="flex justify-between items-center">
                        <h4 className='font-bold'>Información Personal</h4>
                        <Button variant="outline" size="sm" onClick={() => setModalOpen(true)}>
                            <Pencil className='h-4 w-4 mr-1' />Editar
                        </Button>
                    </div>

                    <p className='text-sm text-gray-500 pl-4 mt-1'>Datos personales: tu nombre, email, teléfono, y foto de perfil</p>

                    <div className="flex flex-col md:flex-row items-center mt-4 gap-6">
                        <div className="text-center">
                            <div className="relative inline-block">
                                <img className="rounded-full border-3 border-gray-200 w-44 h-44 md:w-36 md:h-36 object-cover" src={profilePhoto !== imagen_generica ? `${profilePhoto}${profilePhoto.includes('?') ? '&' : '?'}t=${avatarKey}` : profilePhoto} alt="Imagen del perfil" />

                                <button onClick={() => setPhotoModalOpen(true)} className="absolute bottom-1 right-1 bg-primary text-primary-foreground rounded-full p-2 hover:opacity-90 transition-opacity">
                                    <Camera className="h-4 w-4" />
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 flex-1">
                            <div><h6 className='font-bold text-sm'>Nombre</h6><span className='text-sm'>{user?.firstName + ' ' + user?.lastName}</span></div>
                            <div><h6 className='font-bold text-sm'>Telefono</h6><span className='text-sm'>{user?.phone}</span></div>
                            <div><h6 className='font-bold text-sm'>Correo electrónico</h6><span className='text-sm'>{user?.email}</span></div>
                        </div>
                    </div>
                </div>

                {/*Sección 2: Comunidades - listado con avatar, rol, alias, direccón y acciones (editar/abandonar)*/}
                <div className="border border-gray-200 rounded-2xl bg-white shadow-sm p-4 mt-5">
                    <h4 className='font-bold'>Información de tus comunidades</h4>

                    {(!user?.communities || user.communities.length === 0) ? (
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
                                {user.communities.map((com: any) => (
                                    <div key={com.communityId} className={`rounded-xl p-4 flex items-center gap-4 ${com.communityId === user?.activeCommunityId ? 'border-2 border-blue-300 bg-blue-50/40 ring-1 ring-blue-100' : 'border border-gray-200'}`}>
                                        <img src={com.avatarUrl ? `${com.avatarUrl}?t=${avatarKey}` : imagen_generica} alt={com.name} className='w-16 h-16 rounded-full object-cover border-2 border-gray-200' />
                                        <div className="flex-1">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex items-center gap-2">
                                                    <h5 className="font-bold">{com.name}</h5>
                                                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">{com.role}</span>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button variant="outline" size="sm" onClick={() => setCommunityInfoModal({ open: true, community: com })}>
                                                        <Pencil className='h-4 w-4 mr-1' />Editar
                                                    </Button>
                                                    {com.role !== 'PRESIDENT' && (
                                                        <Button variant="outline" size="sm" className='text-red-600 border-red-200 hover:bg-red-50' onClick={() => setLeaveModal({ open: true, communityId: com.communityId, name: com.name })}>
                                                            <LogOut className='h-4 w-4 mr-1' />Abandonar
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                            <p className="text-sm text-gray-500 mt-1">Alias: {com.alias}</p>
                                            <p className="text-sm text-gray-500">{com.address || 'Sin dirección asociada'}</p>
                                            <p className="text-sm text-gray-400">Alta: {com.memberSince ? new Date(com.memberSince).toLocaleDateString('es-ES') : '-'}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}

                    <div className="flex justify-center mt-4">
                        <Link to="/auth/new-community" className="bg-gray-900 text-white rounded-full w-12 h-12 flex items-center justify-center hover:scale-110 transition-transform">
                            <Plus className="h-5 w-5" />
                        </Link>
                    </div>
                </div>

                {/*Sección 3: Historial de solicitudes - estado con badge de color, tipo y botón de cancelar/archivar*/}
                <div className="border border-gray-200 rounded-2xl bg-white shadow-sm p-4 mt-5">
                    <h4 className="font-bold">Mis solicitudes</h4>
                    <p className="text-sm text-gray-500 mb-4">Historial de tus solicitudes enviadas a comunidades.</p>

                    {solicitudes.length > 0 ? (
                        <div className="space-y-3">
                            {solicitudes.map((sol) => (
                                <div key={sol.id} className="border border-gray-200 rounded-xl p-4 flex justify-between items-start">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-sm">{sol.community?.name}</span>
                                            <span className={`text-xs px-2 py-0.5 rounded-full ${sol.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                                                    sol.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                                                        sol.status === 'CANCELLED' ? 'bg-gray-100 text-gray-700' :
                                                            'bg-red-100 text-red-700'}`}>
                                                {sol.status === 'PENDING' ? 'Pendiente' :
                                                    sol.status === 'APPROVED' ? 'Aceptada' :
                                                        sol.status === 'CANCELLED' ? 'Cancelada' : 'Rechazada'}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-500 mt-1">
                                            {sol.type === 'JOIN' ? 'Solicitud de acceso' : 'Cambio de información'}{' - '}{new Date(sol.createdAt).toLocaleDateString('es-ES')}
                                        </p>
                                        {sol.proposedAlias && <p className='text-sm text-gray-500 mt-1'>Alias: {sol.proposedAlias}</p>}
                                        {sol.requestComment && <p className='text-sm text-gray-600 mt-1 italic'>{sol.requestComment}</p>}
                                    </div>
                                    <Button variant="outline" size="sm" onClick={() => handleArchivar(sol.id, sol.status)}>
                                        <Archive className='h-4 w-4 mr-1' />
                                        {sol.status === 'PENDING' ? 'Cancelar' : 'Archivar'}
                                    </Button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-gray-400 text-center py-6">No tienes solicitudes pendientes ni recientes.</p>
                    )}
                </div>

                {/*Sección 4: Configuración de cuenta - cambiar contraseña*/}
                <div className="border border-gray-200 rounded-2xl bg-white shadow-sm p-4 mt-5">

                    <h4 className='font-bold mb-2'>Configuración de la cuenta</h4>

                    <p className='text-sm text-gray-500 mb-4'>Cambia tu contraseña y gestiona la configuración de tu cuenta</p>

                    <div className="flex justify-between items-center py-4 border-b border-gray-100">
                        <div>
                            <h5 className='font-bold text-base'>Cambiar contraseña</h5>
                            <p className="text-sm text-gray-500">Se recomienda actualizar la contraseña periódicamente.</p>
                        </div>

                        <Button variant="outline" size="sm" onClick={() => setPasswordModalOpen(true)}>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/*Sección 5: Acciones rápidas - cerrar sesión y eliminar cuenta*/}
                <div className='mt-5 mb-100'>
                    <h4 className='font-bold mb-3'>Acciones rápidas</h4>
                    <div className="flex flex-col gap-1">
                        <button className='text-left text-gray-500 text-sm py-2 hover:text-[#104084]        transition-colors' onClick={() => setLogoutModalOpen(true)}>
                            <LogOut className='h-4 w-4 inline mr-2' />Cerrar Sesión
                        </button>
                        <button className='text-left text-red-500 text-sm py-2 hover:text-red-700 transition-colors' onClick={() => setDeleteAccountModalOpen(true)}>
                            <Trash2 className='h-4 w-4 inline mr-2' />Eliminar permanentemente mi cuenta
                        </button>
                    </div>
                </div>

            </main>

            {/*Modales: editar perfil, foto, contraseña, logout, eliminar cuenta, editar info comunidad, abandonar comunidad*/}
            <EditProfileModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                initialData={{
                    nombre: user?.firstName || '',
                    apellidos: user?.lastName || '',
                    telefono: user?.phone || '',
                    email: user?.email || ''
                }}
                onSave={async (data) => {
                    await refreshUser();
                }}
            />

            <EditPhotoModal
                isOpen={photoModalOpen}
                onClose={() => setPhotoModalOpen(false)}
                currentPhoto={profilePhoto}
                onSave={async (newPhoto) => { setAvatarKey(Date.now()); setProfilePhoto(newPhoto); await refreshUser(); }}
                onDeletePhoto={async () => { await deleteAvatar(); await refreshUser(); }}
                defaultPhoto={imagen_generica}
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
                onConfirm={async () => {
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

            <EditCommunityInfoModal
                isOpen={communityInfoModal.open}
                onClose={() => setCommunityInfoModal({ open: false, community: null })}
                communityId={communityInfoModal.community?.communityId || ''}
                currentAlias={communityInfoModal.community?.alias || ''}
                currentDomicile={buildCurrentDomicile(communityInfoModal.community)}
                onSuccess={async () => {
                    await cargarSolicitudes();
                }}
            />

            <LeaveCommunityModal
                isOpen={leaveModal.open}
                onClose={() => setLeaveModal({ open: false, communityId: '', name: '' })}
                communityId={leaveModal.communityId}
                communityName={leaveModal.name}
                onSuccess={async () => {
                    await refreshUser();
                }}
            />

            <FeedbackModal
                isOpen={feedback.isOpen}
                type={feedback.type}
                message={feedback.message}
                onClose={closeFeedback}
            />
        </div>
    );


};


export default ProfilePage;
