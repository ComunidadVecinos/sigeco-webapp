import React, {useState, useEffect} from 'react';
import Header from '../../components/common/Header/Header';
import { useAuth } from '@/context/authContext';
import { getAdminSummary, getRequests, getMembers } from '@/services/adminService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import imagen_generica from '../../assets/images/perfil_generico.png';
import { Pencil, Camera, ChevronLeft, ChevronRight, Search, Users, FileText, Building2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import EditCommunityModal from '@/components/ui/EditCommunityModal/EditCommunityModal';
import RequestActionModal from '@/components/ui/RequestActionModal/RequestActionModal';
import SuspendMemberModal from '@/components/ui/SuspendMemberModal/SuspendMemberModal';
import ExpelMemberModal from '@/components/ui/ExpelMemberModal/ExpelMemberModal';
import { cancelSuspension, assignVicepresident } from '@/services/adminService';


const AdminPage: React.FC = () =>{

/*useEffect(() => {
    setSummary({
        community: {
            name: 'Comunidad Residencial Sol',
            cif: 'A12345678',
            avatar: null,
            streetType: 'Calle',
            streetName: 'Gran Vía',
            number: '12',
            municipality: 'Madrid',
            province: 'Madrid',
            country: 'España',
            postalCode: '28013'
        },
        pendingRequests: [
            { id: 1, userName: 'Juan García', type: 'JOIN', createdAt: '2026-02-27T10:00:00Z' },
            { id: 2, userName: 'María López', type: 'PROFILE_CHANGE', createdAt: '2026-02-26T14:00:00Z' },
            { id: 3, userName: 'Pedro Sánchez', type: 'JOIN', createdAt: '2026-02-25T09:00:00Z' }
        ],
        totalMembers: 5,
        members: [
            { id: 1, alias: 'Piso 3A - Familia García', role: 'PRESIDENT', avatar: null, suspended: false },
            { id: 2, alias: 'Bajo B - López', role: 'VICEPRESIDENT', avatar: null, suspended: false },
            { id: 3, alias: 'Piso 1C - Martínez', role: 'MEMBER', avatar: null, suspended: false },
            { id: 4, alias: 'Piso 2A - Fernández', role: 'MEMBER', avatar: null, suspended: true },
            { id: 5, alias: 'Ático - Rodríguez', role: 'MEMBER', avatar: null, suspended: false }
        ]
    });

    setRequests([
        { id: 1, userName: 'Juan García', status: 'PENDING', type: 'JOIN', alias: 'Piso 4B', createdAt: '2026-02-27T10:00:00Z', comment: 'Soy el nuevo vecino del 4B' },
        { id: 2, userName: 'María López', status: 'PENDING', type: 'PROFILE_CHANGE', alias: null, createdAt: '2026-02-26T14:00:00Z', comment: null },
        { id: 3, userName: 'Ana Torres', status: 'APPROVED', type: 'JOIN', alias: 'Piso 1A', createdAt: '2026-02-20T10:00:00Z', comment: null },
        { id: 4, userName: 'Carlos Ruiz', status: 'REJECTED', type: 'JOIN', alias: 'Piso 5C', createdAt: '2026-02-18T10:00:00Z', comment: 'Hola quiero unirme' }
    ]);

    setMembers([
        { id: 1, alias: 'Piso 3A - Familia García', role: 'PRESIDENT', userName: 'Admin García', avatar: null, suspended: false, streetType: 'Calle', streetName: 'Gran Vía', number: '12' },
        { id: 2, alias: 'Bajo B - López', role: 'VICEPRESIDENT', userName: 'María López', avatar: null, suspended: false, streetType: 'Calle', streetName: 'Gran Vía', number: '12' },
        { id: 3, alias: 'Piso 1C - Martínez', role: 'MEMBER', userName: 'Pedro Martínez', avatar: null, suspended: false, streetType: 'Calle', streetName: 'Gran Vía', number: '12' },
        { id: 4, alias: 'Piso 2A - Fernández', role: 'MEMBER', userName: 'Laura Fernández', avatar: null, suspended: true, streetType: 'Calle', streetName: 'Gran Vía', number: '12' },
        { id: 5, alias: 'Ático - Rodríguez', role: 'MEMBER', userName: 'Diego Rodríguez', avatar: null, suspended: false, streetType: 'Calle', streetName: 'Gran Vía', number: '12' }
    ]);
}, []);*/



    const {user} = useAuth();
    const communityId = user?.activeCommunityId;

    //Pestaña activa
    const [activeTab, setActiveTab] = useState<'dashboard' | 'requests' | 'members'>('dashboard');

    //Dashboard
    const [summary, setSummary] = useState<any>(null);

    //Solicitudes
    const [requests, setRequests] = useState<any[]>([]);
    const [requestFilters, setRequestFilters] = useState({status: 'PENDING', type: '', page:0, pageSize: 10});
    const [requestTotalPages, setRequestTotalPages] = useState(0);

    //Miembros
    const [members, setMembers] = useState<any[]>([]);
    const [membersFilters, setMembersFilters] = useState({q: '', suspensionStatus: '', page: 0, pageSize: 10});
    const [memberTotalPages, setMembersTotalPages] = useState(0);

    //Modales
    const [editCommunityModalOpen, setEditCommunityModalOpen] = useState(false);
    const [requestActionModal, setRequestActionModal] = useState<{open: boolean, action: 'approve' | 'reject', requestId: number}>({open: false, action: 'approve', requestId: 0});
    const [suspendModal, setSuspendModal] = useState<{open: boolean, userId: number, alias: string}>({open: false, userId: 0, alias: ''});
    const [expelModal, setExpelModal] = useState<{open: boolean, userId: number, alias: string}>({open: false, userId: 0, alias: ''});

    //Cargar dashboard
    const loadSummary = async () =>{
        if(!communityId) return;
        try{
            const res = await getAdminSummary(communityId);
            setSummary(res.data);
        }catch(err){
            console.error('Error cargando dashboard', err);
        }
    };

    //Cargar solicitudes
    const loadRequests = async () =>{
        if(!communityId) return;
        try{
            const res = await getRequests(communityId, requestFilters);
            setRequests(res.data.content || []);
            setRequestTotalPages(res.data.totalPages || 0);
        }catch(err){
            console.error('Error cargando solicitudes', err);
        }
    };

    //Cargar miembros
    const loadMembers = async () => {
        if(!communityId) return;
        try{
            const res = await getMembers(communityId, membersFilters);
            setMembers(res.data.content || []);
            setMembersTotalPages(res.data.totalPages || 0);
        }catch(err){
            console.error('Error cargando miembros', err);
        }
    };

    useEffect(() => {loadSummary(); }, [communityId]);
    useEffect(() => { if (activeTab === 'requests') loadRequests(); }, [activeTab, requestFilters]);
    useEffect(() => { if (activeTab === 'members') loadMembers(); }, [activeTab, membersFilters]);

    //Buscar rol del usuario
    const activeCommunity = user?.communities?.find((c: any) => c.id === communityId);
    const role = activeCommunity?.role;

    const navigate = useNavigate();
    useEffect(() => {
        if(!role || (role !== 'PRESIDENT' && role !== 'VICEPRESIDENT')){
            navigate('/auth/me');
        }
    }, [role]);

    const handleCancelSuspension = async (userId: number) => {
        if(!confirm('¿Cancelar la suspensión de este miembro?')) return;
        try{
            await cancelSuspension(communityId!, userId);
            loadMembers();
            loadSummary();
        }catch(err: any){
            alert(err.response?.data?.error?.message || 'Error al cancelar suspensión');
        }
    };

    const handleAssingVP = async (userId: number) => {
        if(!confirm('Asignar a este miembro como vicepresidente?')) return;
        try{
            await assignVicepresident(communityId!, userId);
            loadMembers();
            loadSummary();
        }catch(err: any){
            alert(err.response?.data?.error?.message || 'Error al asignar vicepresidente');
        }
    };

    return (
        <div>
            <Header navLinks={[{label: "Perfil", path: "/auth/me"}, {label: "Ayuda", path: "/help"}]}/>

            <main className="max-w-6xl mx-auto px-4">
                <h2 className='text-3xl font-bold mt-35 text-gray-900'>Panel de administración</h2>
                <p className='text-gray-500 mb-8'>Gestiona tu comunidad, solicitudes y miembros.</p>

                {/*Pestañas*/}
                <div className="flex  gap-2 mb-6">
                    <Button variant={activeTab === 'dashboard' ? 'default' : 'outline'} onClick={() => setActiveTab('dashboard')}>
                        <Building2 className='h-4 w-4 mr-2'/> Dashboard
                    </Button>
                    <Button variant={activeTab === 'requests' ? 'default' : 'outline'} onClick={() => setActiveTab('requests')}>
                        <FileText className='h-4 w-4 mr-2'/> Solicitudes
                    </Button>
                    <Button variant={activeTab === 'members' ? 'default' : 'outline'} onClick={() => setActiveTab('members')}>
                        <Users className='h-4 w-4 mr-2'/> Miembros
                    </Button>
                </div>


                {/*Dashboard*/}
                {activeTab === 'dashboard' && summary && (
                    <>
                        {/*Tarjeta de informacion de la comunidad*/}
                        <div className='border border-gray-200 rounded-2xl bg-white shadow-sm p-6 mb-5'>
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-4">
                                    <div className="relative">
                                        <img src={summary.community?.avatar || imagen_generica} alt="Comunidad" className='w-20 h-20 rounded-full object-cover border-2 border-gray-200' />
                                        <button className='absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-1.5 hover:opacity-90 transition-opacity'>
                                            <Camera className='h-3 w-3'/>
                                        </button>
                                    </div>
                                    <div>
                                        <h3 className='text-xl font-bold'>{summary.community?.name}</h3>
                                        <p className="text-sm text-gray-500">CIF: {summary.community?.cif}</p>
                                        <p className="text-sm text-gray-500">
                                            {summary.community?.streetType} {summary.community?.streetName}, {summary.community?.number} - {summary.community?.municipality}, {summary.community?.province}
                                        </p>
                                    </div>
                                </div>
                                <Button variant="outline" size="sm" onClick={() => setEditCommunityModalOpen(true)}>
                                    <Pencil className='h-4 w-4 mr-1'/> Editar
                                </Button>
                            </div>
                        </div>

                        {/*Tarjetas solicitudes pendientes y miembros*/}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                            <div className="border border-gray-200 rounded-2xl bg-white shadow-sm p-6">
                                <div className="flex justify-between items-center mb-4">
                                    <h4 className="font-bold">Solicitudes pendientes</h4>
                                    <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-700">{summary.pendingRequests?.length || 0}</span>
                                </div>
                                {summary.pendingRequests?.length > 0 ? (
                                    <div className="space-y-2">
                                        {summary.pendingRequests.slice(0, 5).map((req: any) => (
                                            <div key={req.id} className="flex justify-between items-center text-sm border-b border-gray-50 pb-2">
                                                <div>
                                                    <span className='font-medium'>{req.userName}</span>
                                                    <span className='text-gray-400 ml-2'>{req.type === 'JOIN' ? 'Acceso' : 'Cambio info'}</span>
                                                </div>
                                                <span className='text-gray-400'>{new Date(req.createdAt).toLocaleDateString('es-ES')}</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-400 text-center py-4">Sin solicitudes pendientes.</p>
                                )}
                                <Button variant="link" className='w-full mt-2' onClick={() => setActiveTab('requests')}>Ver todas</Button>
                            </div>

                            <div className="border border-gray-200 rounded-2xl bg-white shadow-sm p-6">
                                <div className="flex  justify-between items-center mb-4">
                                    <h4 className="font-bold">Miembros</h4>
                                    <span className='text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700'>{summary.totalMembers || 0}</span>
                                </div>
                                {summary.members?.length > 0 ? (
                                    <div className="space-y-2">
                                        {summary.members.slice(0, 8).map((m: any) => (
                                            <div key={m.id} className='flex items-center gap-3 text-sm border-b border-gray-50 pb-2'>
                                                <img src={m.avatar || imagen_generica} alt={m.alias} className='w-8 h-8 rounded-full object-cover' />
                                                <span className='font-medium flex-1'>{m.alias}</span>
                                                <span className='text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700'>{m.role}</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-400 text-center py-4">Sin miembros.</p>
                                )}
                                <Button variant="link" className='w-full mt-2' onClick={() => setActiveTab('members')}>Ver todos</Button>
                            </div>
                        </div>
                    </>
                )}

                {/*Solicitudes*/}
                {activeTab === 'requests' && (
                    <div className="border border-gray-200 rounded-2xl bg-white shadow-sm p-6 mb-5">
                        <h4 className="font-bold mb-4">Solicitudes</h4>

                        {/*Filtros*/}
                        <div className="flex flex-wrap gap-3 mb-4">
                            <select className='border border-gray-200 rounded-lg px-3 py-2 text-sm' value={requestFilters.status} onChange={(e) => setRequestFilters({...requestFilters, status: e.target.value, page: 0})}>
                                <option value="PENDING">Pendientes</option>
                                <option value="APPROVED">Aprobadas</option>
                                <option value="REJECTED">Rechazadas</option>
                                <option value="">Todas</option>
                            </select>
                            <select className='border border-gray-200 rounded-lg px-3 py-2 text-sm' value={requestFilters.type} onChange={(e) => setRequestFilters({...requestFilters, type: e.target.value, page: 0})}>
                                <option value="">Todos los tipos</option>
                                <option value="JOIN">Acceso</option>
                                <option value="PROFILE_CHANGE">Cambio de info</option>
                            </select>
                        </div>

                        {/*Lista*/}
                        {requests.length > 0 ? (
                            <div className="space-y-3">
                                {requests.map((req: any) => (
                                    <div key={req.id} className='border border-gray-200 rounded-xl p-4 flex justify-between items-start'>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className='font-bold text-sm'>{req.userName}</span>
                                                <span className={`text-xs px-2 py-0.5 rounded-full ${req.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' : req.status === 'APPROVED' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                    {req.status === 'PENDING' ? 'Pendiente' : req.status === 'APPROVED' ? 'Aprobada': 'Rechazada'}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-500 mt-1">
                                                {req.type === 'JOIN' ? 'Solicitud de acceso' : 'Cambio de información'} - {new Date(req.createdAt).toLocaleDateString('es-ES')}
                                            </p>
                                            {req.alias && <p className="text-sm text-gray-500">Alias: {req.alias}</p>}
                                            {req.comment && <p className='text-sm text-gray-400 italic mt-1'>"{req.comment}"</p>}
                                        </div>
                                        {req.status === 'PENDING' && (
                                            <div className="flex gap-2">
                                                 <Button size="sm" variant="outline" className='text-green-600 border-green-200 hover:bg-green-50' onClick={() => setRequestActionModal({open: true, action: 'approve', requestId: req.id})}>Aceptar</Button>
                                                 <Button size="sm" variant="outline" className='text-red-600 border-red-200 hover:bg-red-50' onClick={() => setRequestActionModal({open: true, action: 'reject', requestId: req.id})}>Rechazar</Button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-400 text-center py-6">No hay solicitudes con estos filtros.</p>
                        )}

                        {/*Paginacion*/}
                        {requestTotalPages > 1 && (
                            <div className="flex justify-center items-center gap-4 mt-6">
                                <Button variant="outline" size="sm" disabled={requestFilters.page === 0} onClick={() => setRequestFilters({...requestFilters, page: requestFilters.page - 1})}>
                                    <ChevronLeft className='h-4 w-4'/>
                                </Button>
                                <span className="text-sm text-gray-500">Página {requestFilters.page + 1} de {requestTotalPages}</span>
                                <Button variant="outline" size="sm" disabled={requestFilters.page >= requestTotalPages - 1} onClick={() => setRequestFilters({...requestFilters, page: requestFilters.page + 1})}>
                                    <ChevronRight className='h-4 w-4'/>
                                </Button>
                            </div>
                        )}
                    </div>
                )}

                {/*Miembros*/}
                {activeTab === 'members' && (
                    <div className="border border-gray-200 rounded-2xl bg-white shadow-sm p-6 mb-5">
                        <h4 className='font-bold mb-4'>Miembros</h4>

                        {/*Filtros*/}
                        <div className="flex flex-wrap gap-3 mb-4">
                            <div className="relative flex-1 max-w-xs">
                                <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400'/>
                                <Input className='pl-9' placeholder='Buscar por alias o dirección...' value={membersFilters.q} onChange={(e) => setMembersFilters({...membersFilters, q: e.target.value, page:0})}/>
                            </div>
                            <select className='border border-gray-200 rounded-lg px-3 py-2 text-sm' value={membersFilters.suspensionStatus} onChange={(e) => setMembersFilters({...membersFilters, suspensionStatus: e.target.value, page: 0})}>
                                <option value="">Todos</option>
                                <option value="ACTIVE">Activos</option>
                                <option value="INACTIVE">Suspendidos</option>
                            </select>
                        </div>

                        {/*Lista*/}
                        {members.length > 0 ? (
                            <div className="space-y-3">
                                {members.map((m: any) => (
                                    <div key={m.id} className='border border-gray-200 rounded-xl p-4 flex items-center gap-4'>
                                        <img src={m.avatar || imagen_generica} alt={m.alias} className='w-12 h-12 rounded-full object-cover border-2 border-gray-200' />
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className='font-bold text-sm'>{m.alias}</span>
                                                <span className='text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700'>{m.role}</span>
                                                {m.suspended && <span className='text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700'>Suspendido</span>}
                                            </div>
                                            <p className="text-sm text-gray-500">{m.userName}</p>
                                            <p className="text-sm text-gray-400">{m.streetType} {m.streetName}, {m.number}</p>
                                        </div>
                                        {/*Botones de accion*/}
                                        <div className="flex gap-2">
                                            {m.suspended && (
                                                <Button size="sm" variant="outline" onClick={() => handleCancelSuspension(m.id)}>Reactivar</Button>
                                            )}
                                            {!m.suspended && m.role !== 'PRESIDENT' && (
                                                <Button size="sm" variant="outline" className='text-yellow-600' onClick={() => setSuspendModal({open: true, userId:m.id, alias: m.alias})}>Suspender</Button>
                                            )}
                                            {m.role !== 'PRESIDENT' && (
                                                <Button size="sm" variant="outline" className='text-red-600' onClick={() => setExpelModal({open: true, userId:m.id, alias: m.alias})}>Expulsar</Button>
                                            )}
                                            {role === 'PRESIDENT' && m.role !== 'PRESIDENT' && m.role !== 'VICEPRESIDENT' && (
                                                <Button size="sm" variant="outline" className='text-blue-600' onClick={() => handleAssingVP(m.id)}>Asignar VP</Button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-400 text-center py-6">No hay miembros con estos filtros.</p>
                        )}

                        {/*Paginacion*/}
                        {memberTotalPages > 1 && (
                            <div className="flex justify-center items-center gap-4 mt-6">
                                <Button variant="outline" size="sm" disabled={membersFilters.page === 0} onClick={() => setMembersFilters({...membersFilters, page: membersFilters.page - 1})}>
                                    <ChevronLeft className='h-4 w-4'/>
                                </Button>
                                <span className='text-sm text-gray-500'>Página {membersFilters.page + 1} de {memberTotalPages}</span>
                                <Button variant="outline" size="sm" disabled={membersFilters.page > memberTotalPages - 1} onClick={() => setMembersFilters({...membersFilters, page: membersFilters.page + 1})}>
                                    <ChevronRight className='h-4 w-4'/>
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </main>

            {/*Modal editar info comunidad*/}
            <EditCommunityModal
                isOpen={editCommunityModalOpen}
                onClose={() => setEditCommunityModalOpen(false)}
                communityId={communityId ?? 0}
                currentData={summary?.community}
                onSave={() => loadSummary()}
            />

            {/*Modal solicitar accion*/}
            <RequestActionModal
                isOpen={requestActionModal.open}
                onClose={() => setRequestActionModal({...requestActionModal, open: false})}
                action={requestActionModal.action}
                communityId={communityId!}
                requestId={requestActionModal.requestId}
                onSuccess={() => {loadRequests(); loadSummary();}} 
            />

            {/*Modal suspender miembro*/}
            <SuspendMemberModal
                isOpen={suspendModal.open}
                onClose={() => setSuspendModal({...suspendModal, open: false})}
                communityId={communityId!}
                userId={suspendModal.userId}
                memberAlias={suspendModal.alias}
                onSuccess={() => {loadMembers(); loadSummary();}} 
            />

            {/*Modal expuldar miembro*/}
             <ExpelMemberModal
                isOpen={expelModal.open}
                onClose={() => setExpelModal({...expelModal, open: false})}
                communityId={communityId!}
                userId={expelModal.userId}
                memberAlias={expelModal.alias}
                onSuccess={() => {loadMembers(); loadSummary();}} 
            />
        </div>
    );


};

export default AdminPage;