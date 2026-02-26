import React, {useState, useEffect} from 'react';
import Header from '../../components/common/Header/Header';
import { useAuth } from '@/context/authContext';
import { getAdminSummary, getRequests, getMembers } from '@/services/adminService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import imagen_generica from '../../assets/images/perfil_generico.png';
import { Pencil, Camera, ChevronLeft, ChevronRight, Search, Users, FileText, Building2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AdminPage: React.FC = () =>{
    const {user} = useAuth();
    const communityId = user?.activeCommunityId;

    //Pestaña activa
    const [activeTab, setActiveTab] = useState<'dashboard' | 'requests' | 'members'>('dashboard');

    //Dashboard
    const [summary, setSummary] = useState<any>(null);

    //Solicitudes
    const [request, setRequests] = useState<any[]>([]);
    const [requestFilters, setRequestFilters] = useState({status: 'PENDING', type: '', page:0, pageSize: 10});
    const [requestTotalPages, setRequestTotalPages] = useState(0);

    //Miembros
    const [members, setMembers] = useState<any[]>([]);
    const [membersFilters, setMembersFilters] = useState({q: '', suspensionStatus: '', page: 0, pageSize: 10});
    const [memberTotalPages, setMembersTotalPages] = useState(0);

    //Modales
    const [EditCommunityModalOpen, setEditCommunityModalOpen] = useState(false);

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



};

export default AdminPage;