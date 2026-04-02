import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    CalendarDays,
    Camera,
    ChevronLeft,
    ChevronRight,
    FileText,
    Pencil,
    Search,
    Shield,
    Key
} from 'lucide-react';
import Header from '../../components/common/Header/Header';
import imagen_generica from '../../assets/images/perfil_generico.png';
import { useAuth } from '@/context/authContext';
import {
    assignVicepresident,
    cancelSuspension,
    getAdminSummary,
    getMembers,
    getRequests,
    updateCommunityAvatar
} from '@/services/adminService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import EditCommunityModal from '@/components/ui/EditCommunityModal/EditCommunityModal';
import RequestActionModal from '@/components/ui/RequestActionModal/RequestActionModal';
import SuspendMemberModal from '@/components/ui/SuspendMemberModal/SuspendMemberModal';
import ExpelMemberModal from '@/components/ui/ExpelMemberModal/ExpelMemberModal';
import TransferRoleModal from '@/components/ui/TransferRoleModal/TransferRoleModal';
import DeleteCommunityModal from '@/components/ui/DeleteCommunityModal/DeleteCommunityModal';
import EditPhotoModal from '@/components/ui/EditPhotoModal/EditPhotoModal';
import GenerateCodeModal from '@/components/ui/GenerateCodeModal/GenerateCodeModal';


type RequestFilterState = {
    type: string;
    page: number;
    pageSize: number;
};

type MemberFilterState = {
    q: string;
    suspensionStatus: string;
    joinedAfter: string;
    joinedBefore: string;
    page: number;
    pageSize: number;
};

function formatDate(value?: string | null) {
    if (!value) return '-';
    return new Date(value).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
}

function formatRole(role?: string | null) {
    if (role === 'PRESIDENT') return 'Presidente';
    if (role === 'VICE_PRESIDENT') return 'Vicepresidente';
    if (role === 'MEMBER') return 'Vecino/a';
    return role || '-';
}

function formatRequestType(type?: string | null) {
    return type === 'JOIN' ? 'Solicitud de acceso' : 'Modificación de datos';
}

const AdminPage: React.FC = () => {
    const navigate = useNavigate();
    const { user, loading, refreshUser } = useAuth();
    const communityId = user?.activeCommunityId;
    const activeCommunity = user?.communities?.find((community) => community.communityId === communityId);
    const role = activeCommunity?.role;
    const isAdmin = role === 'PRESIDENT' || role === 'VICE_PRESIDENT';

    const [summary, setSummary] = useState<any>(null);
    const [summaryLoading, setSummaryLoading] = useState(false);
    const [requests, setRequests] = useState<any[]>([]);
    const [requestsLoading, setRequestsLoading] = useState(false);
    const [requestFilters, setRequestFilters] = useState<RequestFilterState>({ type: '', page: 1, pageSize: 10 });
    const [requestTotal, setRequestTotal] = useState(0);
    const [requestTotalPages, setRequestTotalPages] = useState(0);
    const [members, setMembers] = useState<any[]>([]);
    const [membersLoading, setMembersLoading] = useState(false);
    const [membersFilters, setMembersFilters] = useState<MemberFilterState>({
        q: '',
        suspensionStatus: '',
        joinedAfter: '',
        joinedBefore: '',
        page: 1,
        pageSize: 10
    });
    const [memberTotalPages, setMembersTotalPages] = useState(0);
    const [editCommunityModalOpen, setEditCommunityModalOpen] = useState(false);
    const [communityAvatarModalOpen, setCommunityAvatarModalOpen] = useState(false);
    const [requestActionModal, setRequestActionModal] = useState<{ open: boolean; action: 'approve' | 'reject'; requestId: string }>({
        open: false,
        action: 'approve',
        requestId: ''
    });
    const [suspendModal, setSuspendModal] = useState({ open: false, userId: '', alias: '' });
    const [expelModal, setExpelModal] = useState({ open: false, userId: '', alias: '' });
    const [transferModal, setTransferModal] = useState<{ open: boolean; userId: string; alias: string; type: 'president' | 'vicepresident' }>({
        open: false,
        userId: '',
        alias: '',
        type: 'president'
    });
    const [deleteCommunityModalOpen, setDeleteCommunityModalOpen] = useState(false);
    const [generateCodeModalOpen, setGenerateCodeModalOpen] = useState(false);

    useEffect(() => {
        if (loading) return;
        if (!communityId || !isAdmin) navigate('/auth/me');
    }, [communityId, isAdmin, loading, navigate]);

    useEffect(() => {
        if (!communityId || !isAdmin) return;
        let cancelled = false;

        const fetchSummary = async () => {
            setSummaryLoading(true);
            try {
                const res = await getAdminSummary(communityId);
                if (!cancelled) setSummary(res.data);
            } catch (err) {
                console.error('Error cargando el resumen de comunidad', err);
            } finally {
                if (!cancelled) setSummaryLoading(false);
            }
        };

        fetchSummary();
        return () => {
            cancelled = true;
        };
    }, [communityId, isAdmin]);

    useEffect(() => {
        if (!communityId || !isAdmin) return;
        let cancelled = false;

        const fetchRequests = async () => {
            setRequestsLoading(true);
            try {
                const res = await getRequests(communityId, requestFilters);
                if (!cancelled) {
                    setRequests(res.data.items || []);
                    setRequestTotal(res.data.total || 0);
                    setRequestTotalPages(Math.max(1, Math.ceil((res.data.total || 0) / requestFilters.pageSize)));
                }
            } catch (err) {
                console.error('Error cargando solicitudes pendientes', err);
            } finally {
                if (!cancelled) setRequestsLoading(false);
            }
        };

        fetchRequests();
        return () => {
            cancelled = true;
        };
    }, [communityId, isAdmin, requestFilters]);

    useEffect(() => {
        if (!communityId || !isAdmin) return;
        let cancelled = false;

        const fetchMembers = async () => {
            setMembersLoading(true);
            try {
                const res = await getMembers(communityId, membersFilters);
                if (!cancelled) {
                    setMembers(res.data.items || []);
                    setMembersTotalPages(res.data.pagination?.totalPages || 0);
                }
            } catch (err) {
                console.error('Error cargando miembros de la comunidad', err);
            } finally {
                if (!cancelled) setMembersLoading(false);
            }
        };

        fetchMembers();
        return () => {
            cancelled = true;
        };
    }, [communityId, isAdmin, membersFilters]);

    const reloadSummary = async () => {
        if (!communityId) return;
        const res = await getAdminSummary(communityId);
        setSummary(res.data);
    };

    const reloadRequests = async () => {
        if (!communityId) return;
        const res = await getRequests(communityId, requestFilters);
        setRequests(res.data.items || []);
        setRequestTotal(res.data.total || 0);
        setRequestTotalPages(Math.max(1, Math.ceil((res.data.total || 0) / requestFilters.pageSize)));
    };

    const reloadMembers = async () => {
        if (!communityId) return;
        const res = await getMembers(communityId, membersFilters);
        setMembers(res.data.items || []);
        setMembersTotalPages(res.data.pagination?.totalPages || 0);
    };

    const refreshAll = async () => {
        await Promise.all([reloadSummary(), reloadRequests(), reloadMembers()]);
    };

    const handleCancelSuspension = async (userId: string) => {
        if (!communityId || !window.confirm('¿Cancelar la suspensión de este miembro?')) return;
        try {
            await cancelSuspension(communityId, userId);
            await Promise.all([reloadMembers(), reloadSummary()]);
        } catch (err: any) {
            window.alert(err.response?.data?.error?.message || 'No se ha podido cancelar la suspensión.');
        }
    };

    const handleAssignVicepresidency = async (userId: string) => {
        if (!communityId || !window.confirm('¿Asignar a este miembro como vicepresidente?')) return;
        try {
            await assignVicepresident(communityId, userId);
            await Promise.all([reloadMembers(), reloadSummary(), refreshUser()]);
        } catch (err: any) {
            window.alert(err.response?.data?.error?.message || 'No se ha podido asignar la vicepresidencia.');
        }
    };

    if (!communityId || !isAdmin) return null;

    return (
        <div>
            <Header navLinks={[{ label: 'Perfil', path: '/auth/me' }, { label: 'Ayuda', path: '/help' }]} />

            <main className="max-w-6xl mx-auto px-4 pb-24">
                <div className="mt-35 mb-8">
                    <h2 className="text-4xl font-bold text-gray-900">Administración de la Comunidad</h2>
                    <p className="text-gray-500 mt-2">
                        Gestiona la información principal de la comunidad, las solicitudes pendientes y el listado de miembros.
                    </p>
                </div>

                <section className="border border-gray-200 rounded-[28px] bg-white shadow-sm p-6 md:p-8 mb-8">
                    <div className="flex flex-col gap-6">
                        <div className="flex items-start justify-between gap-4">
                            <h3 className="text-2xl font-bold text-gray-900">Datos de la Comunidad</h3>
                            <div className="flex flex-wrap items-center justify-end gap-2">
                                <Button variant="outline" size="sm" onClick={() => setGenerateCodeModalOpen(true)}>
                                    <Key className='h-4 w-4 mr-2'/> Generar código
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => setEditCommunityModalOpen(true)}>
                                    <Pencil className="h-4 w-4 mr-2" />Editar
                                </Button>
                                {role === 'PRESIDENT' && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="text-red-600 border-red-200 hover:bg-red-50"
                                        onClick={() => setDeleteCommunityModalOpen(true)}
                                    >
                                        Eliminar comunidad
                                    </Button>
                                )}
                            </div>
                        </div>

                        {summaryLoading && !summary ? (
                            <p className="text-sm text-gray-500">Cargando datos de la comunidad...</p>
                        ) : (
                            <div className="grid grid-cols-1 lg:grid-cols-[240px,1fr] gap-8">
                                <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
                                    <div className="relative">
                                        <img
                                            src={summary?.community?.avatar || imagen_generica}
                                            alt={summary?.community?.name || 'Comunidad'}
                                            className="w-40 h-40 rounded-full object-cover border-4 border-blue-100 shadow-sm"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setCommunityAvatarModalOpen(true)}
                                            className="absolute bottom-2 right-2 bg-primary text-primary-foreground rounded-full p-3 shadow hover:opacity-90 transition-opacity"
                                            aria-label="Cambiar avatar de la comunidad"
                                        >
                                            <Camera className="h-4 w-4" />
                                        </button>
                                    </div>
                                    <div className="mt-5 w-full">
                                        <p className="text-sm text-slate-500">Nombre</p>
                                        <p className="text-2xl font-bold text-gray-900 mt-1">{summary?.community?.name || '-'}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                    <div className="space-y-1 md:col-span-2">
                                        <p className="text-sm text-slate-500">Dirección</p>
                                        <p className="font-semibold text-gray-900">
                                            {summary?.community?.address?.formatted || 'Sin dirección registrada'}
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm text-slate-500">C.I.F.</p>
                                        <p className="font-semibold text-gray-900">{summary?.community?.cif || '-'}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm text-slate-500">Presidente</p>
                                        <p className="font-semibold text-gray-900">{summary?.community?.president?.alias || '-'}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm text-slate-500">Vicepresidente</p>
                                        <p className="font-semibold text-gray-900">{summary?.community?.vicePresident?.alias || '-'}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm text-slate-500">Fecha de creación</p>
                                        <p className="font-semibold text-gray-900">{formatDate(summary?.community?.createdAt)}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm text-slate-500">Número de vecinos</p>
                                        <p className="font-semibold text-gray-900">{summary?.community?.neighborsCount ?? 0}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </section>

                <section className="border border-gray-200 rounded-[28px] bg-white shadow-sm p-6 md:p-8 mb-8">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <h3 className="text-2xl font-bold text-gray-900">Solicitudes pendientes</h3>
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                                {requestTotal} Pendientes
                            </span>
                        </div>

                        <div className="flex items-center gap-3">
                            <FileText className="h-4 w-4 text-slate-400" />
                            <select
                                className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
                                value={requestFilters.type}
                                onChange={(e) => setRequestFilters((prev) => ({ ...prev, type: e.target.value, page: 1 }))}
                            >
                                <option value="">Todos los tipos</option>
                                <option value="JOIN">Solicitud de acceso</option>
                                <option value="UPDATE_INFO">Modificación de datos</option>
                            </select>
                        </div>
                    </div>

                    {requestsLoading && requests.length === 0 ? (
                        <p className="text-sm text-gray-500 py-8">Cargando solicitudes pendientes...</p>
                    ) : requests.length > 0 ? (
                        <div className="space-y-4">
                            {requests.map((request) => (
                                <article key={request.id} className="border border-gray-200 rounded-2xl p-5">
                                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                        <div className="min-w-0">
                                            <div className="flex flex-wrap items-center gap-2 mb-1">
                                                <h4 className="font-bold text-lg text-gray-900">
                                                    {request.requesterName || request.proposedAlias || 'Solicitud pendiente'}
                                                </h4>
                                                <span
                                                    className={`text-xs px-2 py-1 rounded-full ${
                                                        request.type === 'JOIN'
                                                            ? 'bg-blue-100 text-blue-700'
                                                            : 'bg-yellow-100 text-yellow-700'
                                                    }`}
                                                >
                                                    {formatRequestType(request.type)}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-500">
                                                Dirección solicitada: {request.proposedAddress?.formatted || 'Sin dirección indicada'}
                                            </p>
                                            {request.requestComment && (
                                                <p className="text-sm text-gray-700 mt-3">{request.requestComment}</p>
                                            )}
                                        </div>

                                        <div className="flex flex-col items-start lg:items-end gap-3">
                                            <span className="text-sm text-gray-400">{formatDate(request.createdAt)}</span>
                                            <div className="flex gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="border-green-200 text-green-700 hover:bg-green-50"
                                                    onClick={() => setRequestActionModal({ open: true, action: 'approve', requestId: request.id })}
                                                >
                                                    Aceptar
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="border-red-200 text-red-700 hover:bg-red-50"
                                                    onClick={() => setRequestActionModal({ open: true, action: 'reject', requestId: request.id })}
                                                >
                                                    Rechazar
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-gray-400 text-center py-8">No hay solicitudes pendientes con estos filtros.</p>
                    )}

                    {requestTotalPages > 1 && (
                        <div className="flex justify-center items-center gap-4 mt-6">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={requestFilters.page === 1}
                                onClick={() => setRequestFilters((prev) => ({ ...prev, page: prev.page - 1 }))}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <span className="text-sm text-gray-500">Página {requestFilters.page} de {requestTotalPages}</span>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={requestFilters.page >= requestTotalPages}
                                onClick={() => setRequestFilters((prev) => ({ ...prev, page: prev.page + 1 }))}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    )}
                </section>

                <section className="border border-gray-200 rounded-[28px] bg-white shadow-sm p-6 md:p-8">
                    <div className="flex flex-col gap-4 mb-6">
                        <div className="flex items-center gap-3">
                            <h3 className="text-2xl font-bold text-gray-900">Miembros de la Comunidad</h3>
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                                {summary?.community?.neighborsCount ?? members.length} vecinos
                            </span>
                        </div>

                        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.2fr)_220px_180px_180px] gap-3">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    className="pl-9"
                                    placeholder="Buscar por alias o dirección..."
                                    value={membersFilters.q}
                                    onChange={(e) => setMembersFilters((prev) => ({ ...prev, q: e.target.value, page: 1 }))}
                                />
                            </div>
                            <select
                                className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
                                value={membersFilters.suspensionStatus}
                                onChange={(e) => setMembersFilters((prev) => ({ ...prev, suspensionStatus: e.target.value, page: 1 }))}
                            >
                                <option value="">Todos</option>
                                <option value="ACTIVE">Activos</option>
                                <option value="INACTIVE">Suspendidos</option>
                            </select>
                            <Input
                                type="date"
                                value={membersFilters.joinedAfter}
                                onChange={(e) => setMembersFilters((prev) => ({ ...prev, joinedAfter: e.target.value, page: 1 }))}
                            />
                            <Input
                                type="date"
                                value={membersFilters.joinedBefore}
                                onChange={(e) => setMembersFilters((prev) => ({ ...prev, joinedBefore: e.target.value, page: 1 }))}
                            />
                        </div>
                    </div>

                    {membersLoading && members.length === 0 ? (
                        <p className="text-sm text-gray-500 py-8">Cargando miembros de la comunidad...</p>
                    ) : members.length > 0 ? (
                        <div className="space-y-4">
                            {members.map((member) => (
                                <article
                                    key={member.membershipId}
                                    className="border border-gray-200 rounded-2xl p-5 flex flex-col gap-4 xl:flex-row xl:items-start"
                                >
                                    <div className="h-12 w-12 rounded-full bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                                        <img
                                            src={member.profileImageUrl || imagen_generica}
                                            alt={member.alias ? `Foto de ${member.alias}` : 'Foto del miembro'}
                                            className="h-full w-full object-cover"
                                            onError={(event) => {
                                                event.currentTarget.onerror = null;
                                                event.currentTarget.src = imagen_generica;
                                            }}
                                        />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-wrap items-center gap-2 mb-1">
                                            <h4 className="font-bold text-lg text-gray-900">{member.alias || 'Sin alias'}</h4>
                                            <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                                                {formatRole(member.role)}
                                            </span>
                                            {member.suspensionStatus === 'INACTIVE' && (
                                                <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-700">
                                                    Suspendido
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-500">
                                            {member.property?.formatted || 'Sin dirección asociada'}
                                        </p>
                                        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-500">
                                            <span className="inline-flex items-center gap-2">
                                                <CalendarDays className="h-4 w-4" />
                                                Alta: {formatDate(member.createdAt)}
                                            </span>
                                            {member.suspensionStatus === 'INACTIVE' && (
                                                <span className="inline-flex items-center gap-2">
                                                    <Shield className="h-4 w-4" />
                                                    Hasta: {formatDate(member.suspendedUntil)}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-2 xl:justify-end">
                                        {member.suspensionStatus === 'INACTIVE' ? (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleCancelSuspension(member.membershipId)}
                                            >
                                                Reactivar
                                            </Button>
                                        ) : (
                                            member.role !== 'PRESIDENT' && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="text-yellow-700 border-yellow-200 hover:bg-yellow-50"
                                                    onClick={() =>
                                                        setSuspendModal({
                                                            open: true,
                                                            userId: member.membershipId,
                                                            alias: member.alias || 'miembro'
                                                        })
                                                    }
                                                >
                                                    Suspender
                                                </Button>
                                            )
                                        )}

                                        {member.role !== 'PRESIDENT' && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="text-red-700 border-red-200 hover:bg-red-50"
                                                onClick={() =>
                                                    setExpelModal({
                                                        open: true,
                                                        userId: member.membershipId,
                                                        alias: member.alias || 'miembro'
                                                    })
                                                }
                                            >
                                                Expulsar
                                            </Button>
                                        )}

                                        {role === 'PRESIDENT' && member.role !== 'PRESIDENT' && member.role !== 'VICE_PRESIDENT' && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="text-blue-700 border-blue-200 hover:bg-blue-50"
                                                onClick={() => handleAssignVicepresidency(member.membershipId)}
                                            >
                                                Asignar vicepresidencia
                                            </Button>
                                        )}

                                        {role === 'PRESIDENT' && member.role !== 'PRESIDENT' && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="text-purple-700 border-purple-200 hover:bg-purple-50"
                                                onClick={() =>
                                                    setTransferModal({
                                                        open: true,
                                                        userId: member.membershipId,
                                                        alias: member.alias || 'miembro',
                                                        type: 'president'
                                                    })
                                                }
                                            >
                                                Transferir presidencia
                                            </Button>
                                        )}

                                        {role === 'VICE_PRESIDENT' &&
                                            member.role !== 'PRESIDENT' &&
                                            member.role !== 'VICE_PRESIDENT' && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="text-purple-700 border-purple-200 hover:bg-purple-50"
                                                    onClick={() =>
                                                        setTransferModal({
                                                            open: true,
                                                            userId: member.membershipId,
                                                            alias: member.alias || 'miembro',
                                                            type: 'vicepresident'
                                                        })
                                                    }
                                                >
                                                    Transferir vicepresidencia
                                                </Button>
                                            )}
                                    </div>
                                </article>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-gray-400 text-center py-8">No hay miembros con estos filtros.</p>
                    )}

                    {memberTotalPages > 1 && (
                        <div className="flex justify-center items-center gap-4 mt-6">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={membersFilters.page === 1}
                                onClick={() => setMembersFilters((prev) => ({ ...prev, page: prev.page - 1 }))}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <span className="text-sm text-gray-500">Página {membersFilters.page} de {memberTotalPages}</span>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={membersFilters.page >= memberTotalPages}
                                onClick={() => setMembersFilters((prev) => ({ ...prev, page: prev.page + 1 }))}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    )}
                </section>
            </main>

            <EditCommunityModal
                isOpen={editCommunityModalOpen}
                onClose={() => setEditCommunityModalOpen(false)}
                communityId={communityId}
                currentData={summary?.community}
                onSave={reloadSummary}
            />

            <EditPhotoModal
                isOpen={communityAvatarModalOpen}
                onClose={() => setCommunityAvatarModalOpen(false)}
                currentPhoto={summary?.community?.avatar || imagen_generica}
                title="Cambiar avatar de la comunidad"
                selectLabel="Seleccionar nuevo avatar"
                saveErrorFallback="No se ha podido actualizar el avatar de la comunidad."
                uploadPhoto={(file) => updateCommunityAvatar(communityId, file)}
                onSave={async (newPhotoUrl) => {
                    setSummary((prev: any) => (prev ? { ...prev, community: { ...prev.community, avatar: newPhotoUrl } } : prev));
                    await reloadSummary();
                }}
            />

            <RequestActionModal
                isOpen={requestActionModal.open}
                onClose={() => setRequestActionModal((prev) => ({ ...prev, open: false }))}
                action={requestActionModal.action}
                communityId={communityId}
                requestId={requestActionModal.requestId}
                onSuccess={() => {
                    refreshAll();
                }}
            />

            <SuspendMemberModal
                isOpen={suspendModal.open}
                onClose={() => setSuspendModal((prev) => ({ ...prev, open: false }))}
                communityId={communityId}
                userId={suspendModal.userId}
                memberAlias={suspendModal.alias}
                onSuccess={() => {
                    Promise.all([reloadMembers(), reloadSummary()]);
                }}
            />

            <ExpelMemberModal
                isOpen={expelModal.open}
                onClose={() => setExpelModal((prev) => ({ ...prev, open: false }))}
                communityId={communityId}
                userId={expelModal.userId}
                memberAlias={expelModal.alias}
                onSuccess={() => {
                    Promise.all([reloadMembers(), reloadSummary(), refreshUser()]);
                }}
            />

            <TransferRoleModal
                isOpen={transferModal.open}
                onClose={() => setTransferModal((prev) => ({ ...prev, open: false }))}
                communityId={communityId}
                userId={transferModal.userId}
                memberAlias={transferModal.alias}
                transferType={transferModal.type}
                onSuccess={() => {
                    Promise.all([reloadMembers(), reloadSummary(), refreshUser()]);
                }}
            />

            <DeleteCommunityModal
                isOpen={deleteCommunityModalOpen}
                onClose={() => setDeleteCommunityModalOpen(false)}
                communityId={communityId}
                communityName={summary?.community?.name || ''}
            />

            <GenerateCodeModal
                isOpen={generateCodeModalOpen}
                onClose={() => setGenerateCodeModalOpen(false)}
                communityId={communityId}
            />
        </div>
    );
};

export default AdminPage;
