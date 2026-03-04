import React, {useState, useEffect} from 'react';
import Header from '@/components/common/Header/Header';
import { useAuth } from '@/context/authContext';
import { getGenerealHelp, getComunnityHelp, deleteHelpSection, reorderHelpSections } from '@/services/helpServices';
import { Button } from '@/components/ui/button';
import {Plus, Pencil, Trash2, ChevronUp, ChevronDown, HelpCircle, BookOpen} from 'lucide-react';
import HelpSectionModal from '@/components/ui/HelpSectionModal/HelpSectionModal';

const HelpPage: React.FC = () =>{
    const {user} = useAuth();
    const communityId = user?.activeCommunityId;

    //Rol del usuario
    const activeCommunity: any = user?.communities?.find((c: any) => c.id === communityId);
    const isAdmin = activeCommunity?.role === 'PRESIDENT' || activeCommunity?.role === 'VICEPRESIDENT';

    //Datos
    const [generalHelp, setGeneralHelp] = useState<any>(null);
    const [communitySections, setCommunitySections] = useState<any[]>([]);

    //Modal
    const [sectionModalOpen, setSectionModalOpen] = useState(false);
    const [editingSection, setEditingSection] = useState<any>(null);

    //Reordenar
    const [reordering, setReordering] = useState(false);
    const [tempSections, setTempSections] = useState<any[]>([]);

    //Cargar ayuda general
    const loadGeneralHelp = async () => {
        try {
            const res = await getGenerealHelp();
            setGeneralHelp(res.data);
        } catch(err){
            console.error('Error cargando ayuda general', err);
        }
    };

    //Cargar ayuda comunidad
    const loadCommunityHelp = async () => {
        if(!communityId) return;
        try{
            const res = await getComunnityHelp(communityId);
            setCommunitySections(res.data.sections || []);
        }catch(err){
            console.error('Error cargadno ayuda comunidad', err);
        }
    };

    useEffect(() => {loadGeneralHelp(); }, []);
    useEffect(() => {loadCommunityHelp(); }, [communityId]);

    /*PRUEBAS
    useEffect(() => {
        setGeneralHelp({ content: 'Bienvenido a SIGECO. Esta plataforma te permite gestionar tu comunidad de vecinos. Desde aquí puedes consultar el foro, gestionar incidencias, hacer reservas y mucho más.' });
        setCommunitySections([
            { id: 1, title: 'Horarios de recogida de basura', description: 'Lunes y jueves: orgánica. Martes y viernes: envases. Miércoles: papel y cartón.' },
            { id: 2, title: 'Normas de la piscina', description: 'Horario: 10:00 - 21:00 (junio-septiembre). Obligatorio ducharse antes de entrar. Prohibido comer en la zona de baño.' },
            { id: 3, title: 'Contacto del administrador', description: 'Para urgencias fuera de horario: 600 123 456. Email: admin@comunidadsol.es' }
        ]);
    }, []);*/


    //Eliminar seccion
    const handleDelete = async (sectionId: number) => {
        if(!confirm('¿Eliminar esta sección de ayuda?')) return;
        try{
            await deleteHelpSection(communityId!, sectionId);
            loadCommunityHelp();
        } catch(err: any){
            alert(err.response?.data?.error?.message || 'Error al eliminar');
        }
    };  

    //Reordenar 
    const moveSection = (index: number, direction: 'up' | 'down') => {
        const newSections = [...tempSections];
        const swap = direction === 'up' ? index - 1 : index + 1;
        if(swap < 0 || swap >= newSections.length) return;
        [newSections[index], newSections[swap]] = [newSections[swap], newSections[index]];
        setTempSections(newSections);
    };

    //Confirmar reorden
    const handleConfirmarReorder = async () => {
        try{
            const sectionIds = tempSections.map((s: any) => s.id);
            await reorderHelpSections(communityId!, sectionIds);
            setCommunitySections(tempSections);
            setReordering(false);
        }catch (err: any){
            alert(err.response?.data?.error?.message || 'Error al reordenar');
        }
    };
    
    //Activar modo reordenar
    const startReordering = () => {
        setTempSections([...communitySections]);
        setReordering(true);
    };

    return(
        <div>
            <Header navLinks={[{label: "Perfil", path: "/auth/me"}, {label: "Foro", path: "/auth/forum"}]}/>

            <main className='max-w-5xl mx-auto px-4'>
                <h2 className='text-3xl font-bold mt-35 text-gray-900'>Ayuda</h2>
                <p className='text-gray-500 mb-8'>Consulta información útil sobre SIGECO y tu comunidad.</p>

                {/*Ayuda general*/}
                <div className="border border-gray-200 rounded-2xl bg-white shadow-sm p-6 mb-5">
                    <div className="flex items-center gap-2 mb-4">
                        <HelpCircle className='h-5 w-5 text-blue-600'/>
                        <h3 className="text-lg font-bold">Ayuda General</h3>
                    </div>
                    {generalHelp ? (
                        <div className="text-sm text-gray-600 space-y-2">
                            <p>{generalHelp.content || "Bienvenido a SIGECO. Aquí encontrarás información sobre cómo usar la plataforma."}</p>
                        </div>
                    ) : (
                        <p className="text-sm text-gray-400">Cargando ayuda general...</p>
                    )}
                </div>

                {/*Ayuda de la comunidad*/}
                {communityId && (
                    <div className="border border-gray-200 rounded-2xl bg-white shadow-sm p-6 mb-5">
                        <div className="flex justify-between items-center mb-4">
                            <div className="flex items-center gap-2">
                                <BookOpen className='h-5 w-5 text-green-600'/>
                                <h3 className='text-lg font-bold'>Ayuda de la Comunidad</h3>
                                <span className='text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500'>
                                    {communitySections.length}/8 secciones
                                </span>
                            </div>
                            {isAdmin && (
                                <div className="flex gap-2">
                                    {!reordering && communitySections.length > 1 && (
                                        <Button variant="outline" size="sm" onClick={startReordering}>
                                            Reordenar
                                        </Button>
                                    )}
                                    {reordering && (
                                        <>
                                            <Button variant="outline" size="sm" onClick={() => setReordering(false)}>Cancelar</Button>
                                            <Button size="sm" onClick={handleConfirmarReorder}>Confirmar orden</Button>
                                        </>
                                    )}
                                    {!reordering && communitySections.length < 8 && (
                                        <Button size="sm" onClick={() => {setEditingSection(null); setSectionModalOpen(true);}}>
                                            <Plus className='h-4 w-4 mr-1'/>Añadir
                                        </Button>
                                    )}
                                </div>
                            )}
                        </div>

                        {/*Lista de secciones*/}
                        {(reordering ? tempSections : communitySections).length > 0 ? (
                            <div className="space-y-3">
                                {(reordering ? tempSections : communitySections).map((section: any, index: number) => (
                                    <div key={section.id} className="border border-gray-200 rounded-xl p-4">
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <h4 className='font-bold text-sm'>{section.title}</h4>
                                                <p className='text-sm text-gray-500 mt-1'>{section.description}</p>
                                            </div>
                                            {isAdmin && !reordering && (
                                                <div className="flex gap-1 ml-3">
                                                    <Button variant="ghost" size="sm" onClick={() => {setEditingSection(section); setSectionModalOpen(true);}}>
                                                        <Pencil className='h-4 w-4' />
                                                    </Button>
                                                    <Button variant="ghost" size="sm" className='text-red-500' onClick={() => handleDelete(section.id)}>
                                                        <Trash2 className='h-4 w-4' />
                                                    </Button>
                                                </div>
                                            )}
                                            {reordering && (
                                                <div className="flex flex-col gap-1 ml-3">
                                                    <Button variant="ghost" size="sm" disabled={index === 0} onClick={() =>moveSection(index, 'up')}>
                                                        <ChevronUp className='h-4 w-4'/>
                                                    </Button>
                                                    <Button variant="ghost" size="sm" disabled={index === tempSections.length - 1} onClick={() => moveSection(index, 'down')}>
                                                        <ChevronDown className='h-4 w-4'/>
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-400 text-center py-6">
                                {isAdmin ? 'No hay secciones de ayuda. Añade la primera.' : 'No hay secciones de ayuda disponibles.'}
                            </p>
                        )}
                    </div>
                )}
            </main>

            {/*Modal añadir/editar seccion*/}
            <HelpSectionModal
                isOpen={sectionModalOpen}
                onClose={() => {setSectionModalOpen(false); setEditingSection(null);}}
                communityId={communityId!}
                section={editingSection}
                onSuccess={loadCommunityHelp}
            />
        </div>
    );
};

export default HelpPage;