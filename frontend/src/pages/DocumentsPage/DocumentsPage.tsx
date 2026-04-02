import React, {useEffect, useState} from 'react';
import Header from '@/components/common/Header/Header';
import Sidebar from '@/components/ui/Sidebar/Sidebar';
import CreateFolderModal from '@/components/ui/CreateFolderModal/CreateFolderModal';
import CreateDocumentModal from '@/components/ui/CreateDocumentModal/CreateDocumentModal';
import EditDocumentModal from '@/components/ui/EditDocumentModal/EditDocumentModal';
import DocumentViewerModal from '@/components/ui/DocumentViewerModal/DocumentViewerModal';
import {Menu, FolderPlus, Upload, Folder, FileText, ChevronDown, ChevronRight, Pencil, Trash2} from 'lucide-react';
import { useAuth } from '@/context/authContext';
import { Button } from '@/components/ui/button';
import { getDocuments, deleteDocument, DocItem } from '@/services/documentService';
import {format} from 'date-fns';
import {es} from 'date-fns/locale';

const DocumentsPage: React.FC = () => {
    const {user} = useAuth();
    const communityId = user?.activeCommunityId;
    const activeCommunity: any = user?.communities?.find((c: any) => c.communityId === communityId);
    const isAdmin = activeCommunity?.role === 'PRESIDENT' || activeCommunity?.role === 'VICE_PRESIDENT';

    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [documents, setDocuments] = useState<DocItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

    const [folderModalOpen, setFolderModalOpen] = useState(false);
    const [documentModalOpen, setDocumentModalOpen] = useState(false);
    const [editModal, setEditModal] = useState<{open: boolean; docId: string; name: string}>({open: false, docId: '', name: ''});
    const [viewerModal, setViewerModal] = useState<{open: boolean; url: string; name: string}>({open: false, url: '', name: ''});

    const loadDocuments = async () => {
        if(!communityId) return;
        setLoading(true);
        try{
            const res = await getDocuments(communityId);
            setDocuments(res.data);
        } catch (err) {
            console.error('Error cargando docuemntos', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {loadDocuments();}, [communityId]);

    const toggleFolder = (folderId: string) => {
        setExpandedFolders(prev => {
            const next = new Set(prev);
            next.has(folderId) ? next.delete(folderId) : next.add(folderId);
            return next;
        });
    };

    const handleDelete = async (docId: string, name: string, type: string) => {
        const msg = type === 'folder' ? `¿Eliminar la carpeta "${name}" y todo su contenido?` : `¿Eliminar el documento "${name}"?`;
        if(!communityId || !confirm(msg)) return;
        try{
            await deleteDocument(communityId, docId);
            await loadDocuments();
        } catch (err: any) {
            alert(err.response?.data?.error?.message || 'Error al eliminar.');
        }
    };

    const rootFolders = documents.filter(d => d.type === 'folder' && d.parentId === null);
    const rootFiles = documents.filter(d => d.type === 'file' && d.parentId === null);
    const getChildren = (folderId: string) => documents.filter(d => d.parentId === folderId);

    const formatDate = (date: string) => {
        try {
            return format(new Date(date), "d MMM yyyy", {locale: es}); 
        } catch {
            return date;
        }
    };

    const renderFileRow = (doc: DocItem, indent = false) => (
        <div
            key={doc.id}
            className={`flex items-center gap-3 px-4 py-3 hover:bg-gray-50 rounded-lg cursor-pointer group ${indent ? 'ml-8' : ''}`}
            onClick={() => doc.url && setViewerModal({open: true, url: doc.url, name: doc.name})}
        >
            <FileText className='h-5 w-5 text-red-400 flex-shrink-0' />
            <div className='flex-1 min-w-0'>
                <p className="text-sm font-medium text-gray-900 truncate">{doc.name}</p>
                {doc.description && <p className='text-xs text-gray-400 truncate'>{doc.description}</p>}
            </div>
            <span className='text-xs text-gray-400 flex-shrink-0'>{formatDate(doc.createdAt)}</span>
            {isAdmin && (
                <div className='flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0' onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className='h-7 w-7 text-gray-400 hover:text-blue-600' onClick={() => setEditModal({open: true, docId: doc.id, name: doc.name})}>
                        <Pencil className='h-3.5 w-3.5' />
                    </Button>
                    <Button variant="ghost" size="icon" className='h-7 w-7 text-gray-400 hover:text-red-600' onClick={() => handleDelete(doc.id, doc.name, doc.type)}>
                        <Trash2 className='h-3.5 w-3.5' />
                    </Button>
                </div>
            )}
        </div>
    );

    const renderFolder = (folder: DocItem) => {
        const isExpanded = expandedFolders.has(folder.id);
        const children = getChildren(folder.id);

        return (
            <div key={folder.id}>
                <div className='flex items-center gap-3 px-4 py-3 hover:bg-gray-50 rounded-lg cursor-pointer group' onClick={() => toggleFolder(folder.id)}>
                    {isExpanded 
                        ? <ChevronDown className='h-4 w-4 text-gray-400 flex-shrink-0' />
                        : <ChevronRight className='h-4 w-4 text-gray-400 flex-shrink-0' />
                    }
                    <Folder className={`h-5 w-5 flex-shrink-0 ${isExpanded ? 'text-blue-500' : 'text-yellow-500'}`} />
                    <div className='flex-1 min-w-0'>
                        <p className='text-sm font-semibold text-gray-900'>{folder.name}</p>
                    </div>
                    <span className='text-xs text-gray-400 flex-shrink-0'>{children.length} archivo {children.length !== 1 ? 's' : ''}</span>
                    {isAdmin && (
                        <div className='flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0' onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className='h-7 w-7 text-gray-400 hover:text-blue-600' onClick={() => setEditModal({open: true, docId: folder.id, name: folder.name})}>
                                <Pencil className='h-3.5 w-3.5' />
                            </Button>
                            <Button variant="ghost" size="icon" className='h-7 w-7 text-gray-400 hover:text-red-600' onClick={() => handleDelete(folder.id, folder.name, folder.type)}>
                                <Trash2 className='h-3.5 w-3.5' />
                            </Button>
                        </div>
                    )}
                </div>
                {isExpanded && (
                    <div className='border-l-2 border-gray-100 ml-6'>
                        {children.length > 0 ? children.map(child => renderFileRow(child, true)) : <p className='text-xs text-gray-400 py-2 ml-12'>Carpeta vacía</p>}
                    </div>
                )}
            </div>
        );
    };

    const folders = documents.filter(d => d.type === 'folder');

    return (
        <div>
            <Header showCommunutySwitcher={true} navLinks={[
                {label: <><Menu className='h-4 w-4 inline mr-1' /> Comunidad</>, path: "#", onClick: () => setSidebarOpen(true)},
                {label: "Calendario", path: "/calendar"},
                {label: "Ayuda", path: "/help"}
            ]}/>
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)}/>
                
            <main className='max-w-[700px] mx-auto pt-[250px] md:pt-[200px] px-4 md:px-0'>
                <h1 className='text-[28px] font-bold mb-7 text-center'>Documentos</h1>

                {isAdmin && (
                    <div className='flex gap-3 mb-6'>
                        <Button size="sm" variant="outline" onClick={() => setFolderModalOpen(true)}>
                            <FolderPlus className='h-4 w-4 mr-2'/> Nueva carpeta
                        </Button>
                        <Button size="sm" onClick={() => setDocumentModalOpen(true)}>
                            <Upload className='h-4 w-4 mr-2' /> Subir documento
                        </Button>
                    </div>
                )}

                <div className='bg-white rounded-2xl border border-gray-200 shadow-sm divide-y divide-gray-100'>
                    {loading && documents.length === 0 && <p className='text-sm text-gray-400 text-center py-8'>Cargando documentos...</p>}
                    {!loading && documents.length === 0 && <p className='text-sm text-gray-400 text-center py-8'>No hay documentos ni carpetas.</p>}
                    {rootFolders.map(folder => renderFolder(folder))}
                    {rootFiles.map(file => renderFileRow(file))}
                </div>
            </main>

            <CreateFolderModal
                isOpen={folderModalOpen} 
                onClose={() => setFolderModalOpen(false)}
                communityId={communityId!}
                onSuccess={loadDocuments}
            />

            <CreateDocumentModal
                isOpen={documentModalOpen} 
                onClose={() => setDocumentModalOpen(false)}
                communityId={communityId!}
                folders={folders}
                onSuccess={loadDocuments}
            />

            <EditDocumentModal
                isOpen={editModal.open} 
                onClose={() => setEditModal({open: false, docId: '', name: ''})}
                communityId={communityId!}
                docId={editModal.docId}
                currentName={editModal.name}
                onSuccess={loadDocuments}
            />

            <DocumentViewerModal
                isOpen={viewerModal.open} 
                onClose={() => setViewerModal({open: false, url: '', name: ''})}
                documentUrl ={viewerModal.url}
                documentName={viewerModal.name}
            />
        </div>
    );

};

export default DocumentsPage;
