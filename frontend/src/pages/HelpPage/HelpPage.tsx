import React, { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, ChevronUp, ChevronDown, HelpCircle, BookOpen } from 'lucide-react';
import Header from '@/components/common/Header/Header';
import { useAuth } from '@/context/authContext';
import { getGeneralHelp, getCommunityHelp, deleteHelpSection, reorderHelpSections } from '@/services/helpServices';
import { Button } from '@/components/ui/button';
import HelpSectionModal from '@/components/ui/HelpSectionModal/HelpSectionModal';

const HelpPage: React.FC = () => {
    const { user } = useAuth();
    const communityId = user?.activeCommunityId;

    const activeCommunity: any = user?.communities?.find((community: any) => community.communityId === communityId);
    const isAdmin = activeCommunity?.role === 'PRESIDENT' || activeCommunity?.role === 'VICE_PRESIDENT';

    const [generalHelp, setGeneralHelp] = useState<any[]>([]);
    const [communitySections, setCommunitySections] = useState<any[]>([]);
    const [sectionModalOpen, setSectionModalOpen] = useState(false);
    const [editingSection, setEditingSection] = useState<any>(null);
    const [reordering, setReordering] = useState(false);
    const [tempSections, setTempSections] = useState<any[]>([]);

    const loadGeneralHelp = async () => {
        try {
            const res = await getGeneralHelp();
            setGeneralHelp(res.data.generalHelp || []);
        } catch (err) {
            console.error('Error cargando ayuda general', err);
        }
    };

    const loadCommunityHelp = async () => {
        if (!communityId) return;

        try {
            const res = await getCommunityHelp(communityId);
            setCommunitySections(res.data.communityHelpSections || []);
        } catch (err) {
            console.error('Error cargando ayuda de la comunidad', err);
        }
    };

    useEffect(() => {
        loadGeneralHelp();
    }, []);

    useEffect(() => {
        loadCommunityHelp();
    }, [communityId]);

    const handleDelete = async (sectionId: string) => {
        if (!confirm('¿Eliminar esta sección de ayuda?')) return;

        try {
            await deleteHelpSection(communityId!, sectionId);
            loadCommunityHelp();
        } catch (err: any) {
            alert(err.response?.data?.error?.message || 'Error al eliminar la sección');
        }
    };

    const moveSection = (index: number, direction: 'up' | 'down') => {
        const newSections = [...tempSections];
        const swapIndex = direction === 'up' ? index - 1 : index + 1;

        if (swapIndex < 0 || swapIndex >= newSections.length) return;

        [newSections[index], newSections[swapIndex]] = [newSections[swapIndex], newSections[index]];
        setTempSections(newSections);
    };

    const handleConfirmarReorder = async () => {
        try {
            const sectionIds = tempSections.map((section: any) => section.id);
            await reorderHelpSections(communityId!, sectionIds);
            setCommunitySections(tempSections);
            setReordering(false);
        } catch (err: any) {
            alert(err.response?.data?.error?.message || 'Error al reordenar');
        }
    };

    const startReordering = () => {
        setTempSections([...communitySections]);
        setReordering(true);
    };

    return (
        <div>
            <Header
                showCommunutySwitcher={true}
                navLinks={[{ label: 'Ayuda', path: '/help' }]}
            />

            <main className="max-w-5xl mx-auto pt-[250px] md:pt-[200px] px-4">
                <h2 className="text-3xl font-bold text-gray-900">Ayuda</h2>
                <p className="text-gray-500 mt-4 mb-10">Consulta información útil sobre SIGECO y tu comunidad.</p>

                <div className="border border-gray-200 rounded-2xl bg-white shadow-sm p-6 mb-5">
                    <div className="flex items-center gap-2 mb-4">
                        <HelpCircle className="h-5 w-5 text-blue-600" />
                        <h3 className="text-lg font-bold">Ayuda general</h3>
                    </div>

                    {generalHelp.length > 0 ? (
                        <div className="text-sm text-gray-600 space-y-2">
                            {generalHelp.map((section: any) => (
                                <div key={section.key}>
                                    <p className="font-semibold text-gray-800">{section.title}</p>
                                    <p>{section.description}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-gray-400">Cargando ayuda general...</p>
                    )}
                </div>

                {communityId && (
                    <div className="border border-gray-200 rounded-2xl bg-white shadow-sm p-6 mb-5">
                        <div className="flex justify-between items-center mb-4">
                            <div className="flex items-center gap-2">
                                <BookOpen className="h-5 w-5 text-green-600" />
                                <h3 className="text-lg font-bold">Ayuda de la comunidad</h3>
                                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
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
                                            <Button variant="outline" size="sm" onClick={() => setReordering(false)}>
                                                Cancelar
                                            </Button>
                                            <Button size="sm" onClick={handleConfirmarReorder}>
                                                Confirmar orden
                                            </Button>
                                        </>
                                    )}

                                    {!reordering && communitySections.length < 8 && (
                                        <Button size="sm" onClick={() => { setEditingSection(null); setSectionModalOpen(true); }}>
                                            <Plus className="h-4 w-4 mr-1" />Añadir
                                        </Button>
                                    )}
                                </div>
                            )}
                        </div>

                        {(reordering ? tempSections : communitySections).length > 0 ? (
                            <div className="space-y-3">
                                {(reordering ? tempSections : communitySections).map((section: any, index: number) => (
                                    <div key={section.id} className="border border-gray-200 rounded-xl p-4">
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <h4 className="font-bold text-sm">{section.title}</h4>
                                                <p className="text-sm text-gray-500 mt-1">{section.description}</p>
                                            </div>

                                            {isAdmin && !reordering && (
                                                <div className="flex gap-1 ml-3">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => {
                                                            setEditingSection(section);
                                                            setSectionModalOpen(true);
                                                        }}
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-red-500"
                                                        onClick={() => handleDelete(section.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            )}

                                            {reordering && (
                                                <div className="flex flex-col gap-1 ml-3">
                                                    <Button variant="ghost" size="sm" disabled={index === 0} onClick={() => moveSection(index, 'up')}>
                                                        <ChevronUp className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        disabled={index === tempSections.length - 1}
                                                        onClick={() => moveSection(index, 'down')}
                                                    >
                                                        <ChevronDown className="h-4 w-4" />
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

            <HelpSectionModal
                isOpen={sectionModalOpen}
                onClose={() => {
                    setSectionModalOpen(false);
                    setEditingSection(null);
                }}
                communityId={communityId!}
                section={editingSection}
                onSuccess={loadCommunityHelp}
            />
        </div>
    );
};

export default HelpPage;
