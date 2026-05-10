//Gestor de documentos de la comunidad: árbol jerárquico de carpetas/archivos con drag & drop, visor, CRUD (solo admins) y barra de capacidad
import React, {useEffect, useState} from 'react';
import Header from '@/components/common/Header/Header';
import Sidebar from '@/components/ui/Sidebar/Sidebar';
import CreateFolderModal from '@/components/ui/CreateFolderModal/CreateFolderModal';
import CreateDocumentModal from '@/components/ui/CreateDocumentModal/CreateDocumentModal';
import EditDocumentModal from '@/components/ui/EditDocumentModal/EditDocumentModal';
import DocumentViewerModal from '@/components/ui/DocumentViewerModal/DocumentViewerModal';
import {Menu, FolderPlus, Upload, Folder, FileText, ChevronDown, ChevronRight, Pencil, Trash2, FilePlus, HardDrive} from 'lucide-react';
import { useAuth } from '@/context/authContext';
import { Button } from '@/components/ui/button';
import { getDocuments, deleteDocument, DocItem, moveItem } from '@/services/documentService';
import {format} from 'date-fns';
import {es} from 'date-fns/locale';
import FeedbackModal from '@/components/ui/FeedbackModal/FeedbackModal';
import ConfirmModal from '@/components/ui/ConfirmModal/ConfirmModal';


const DocumentsPage: React.FC = () => {
    const {user} = useAuth();
    const communityId = user?.activeCommunityId;
    const activeCommunity: any = user?.communities?.find((c: any) => c.communityId === communityId);
    const isAdmin = activeCommunity?.role === 'PRESIDENT' || activeCommunity?.role === 'VICE_PRESIDENT';
    //Estado de la vista: sidebar, listado de documentos, carga y carpetas expandidas
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [documents, setDocuments] = useState<DocItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
    //Modales: crear carpeta, subir documento, editar nombre, visor de archivo
    const [folderModalOpen, setFolderModalOpen] = useState(false);
    const [documentModalOpen, setDocumentModalOpen] = useState(false);
    const [createInFolderId, setCreateInFolderId] = useState<string | null>(null);
    const [editModal, setEditModal] = useState<{open: boolean; docId: string; name: string; description?: string; type: string}>({open: false, docId: '', name: '', description: '', type: ''});
    const [viewerModal, setViewerModal] = useState<{open: boolean; url: string; name: string}>({open: false, url: '', name: ''});
    //Almacenamiento y estado de drag & drop
    const [storageInfo, setStorageInfo] = useState<{quotaBytes: number; usedBytes: number} | null>(null);
    const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null);
    const [dragOverRoot, setDragOverRoot] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    //Feedback global y confirmación de eliminación
    const [feedback, setFeedback] = useState<{isOpen: boolean, type: 'success' | 'error', message: string}>({isOpen: false, type: 'success', message: ''});
    const closeFeedback = () => setFeedback(prev => ({...prev, isOpen: false}));
    const [confirmAction, setConfirmAction] = useState<{isOpen: boolean; type: 'delete' | null; docId: string; docType: string; title: string; message: string;}>({isOpen: false, type: null, docId: '', docType: '', title: '', message: ''});

    //Craga el árbol raíz de documentos (carpetas + archivos) y la info de almacenamiento
    const loadDocuments = async () => {
        if(!communityId) return;
        setLoading(true);
        try{
            const res = await getDocuments(communityId);
            const responseData = res.data as any;

            const combined = [
                ...(responseData.folders?.map((f: any) => ({...f, type: 'folder' as 'folder'})) || []),
                ...(responseData.documents?.map((d: any) => ({...d, type: 'file' as 'file'})) || [])
            ];

            setDocuments(combined);
            setExpandedFolders(new Set());

            if(responseData.storage) {
                setStorageInfo({
                    quotaBytes: responseData.storage.quotaBytes,
                    usedBytes: responseData.storage.usedBytes
                });
            }
        } catch (err) {
            console.error('Error cargando documentos', err);
        } finally {
            setLoading(false);
        }
    };

    //Carga bajo demanda los hijos de una carpeta
    const loadChildren = async (folderId: string) => {
        if(!communityId) return;
        if(documents.some(d => d.parentId === folderId)) return;
        try{
            const res = await getDocuments(communityId, folderId);
            const responseData = res.data as any;
            const combined = [
                ...(responseData.folders?.map((f: any) => ({...f, type: 'folder' as 'folder'})) || []),
                ...(responseData.documents?.map((d: any) => ({...d, type: 'file' as 'file'})) || [])
            ];
            setDocuments(prev => [...prev, ...combined]);
        } catch(err){
            console.error('Error cargando subcarpetas', err);
        }
    };

    //Recarga los documentos cuando cambia la comunidad activa
    useEffect(() => {loadDocuments();}, [communityId]);

    //Expande o colapsa la carpeta, cargando sus hijos si es la primera vez
    const toggleFolder = async (folderId: string) => {
        if(!expandedFolders.has(folderId)){
            await loadChildren(folderId);
        }
        setExpandedFolders(prev => {
            const next = new Set(prev);
            next.has(folderId) ? next.delete(folderId) : next.add(folderId);
            return next;
        });
    };

    //Elimina un documento o carpeta y recarga el árbol completo
    const handleDelete = async (docId: string, name: string, type: string) => {
        if(!communityId) return;
        try{
            await deleteDocument(communityId, docId, type);
            await loadDocuments();
        } catch (err: any) {
            setFeedback({isOpen: true, type: 'error', message: err.response?.data?.error?.message || 'Error al eliminar.'});
        }
    };

    //Drag & Drop: inicia el drag guardando el id, tipo y parentId del elemento arrastrado
    const handleDragStart = (e: React.DragEvent, item: DocItem) => {
        e.dataTransfer.setData('application/json', JSON.stringify({id: item.id, type: item.type, parentId: item.parentId}));
        e.dataTransfer.effectAllowed = 'move';
        setIsDragging(true);
    };

    //Mueve un elemento dentro de una carpeta destino vía API
    const handleDropOnFolder = async (e: React.DragEvent, targetFolderId: string) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOverFolderId(null);
        setIsDragging(false);
        if(!communityId || !isAdmin) return;
        try{
            const data = JSON.parse(e.dataTransfer.getData('application/json'));
            if(data.id === targetFolderId) return;
            if(data.parentId === targetFolderId) return;
            await moveItem(communityId, {itemId:data.id, itemType: data.type, targetFolderId});
            await loadDocuments();
        } catch (err: any){
            setFeedback({isOpen: true, type: 'error', message: err.response?.data?.error?.message || 'Error al mover el elemento.'});
        }
    };

    //Mueve un elemento a la raíz
    const handleDropOnRoot = async (e: React.DragEvent) => {
        e.preventDefault();
        setDragOverRoot(false);
        setIsDragging(false);
        if(!communityId || !isAdmin) return;

        try{
            const data = JSON.parse(e.dataTransfer.getData('application/json'));
            if(data.parentId === null) return;
            await moveItem(communityId, {itemId: data.id, itemType: data.type, targetFolderId: null});
            await loadDocuments();
        } catch (err: any){
            setFeedback({isOpen: true, type: 'error', message: err.response?.data?.error?.message || 'Error al mover el elemento.'});
        }
    };

    //Listas filtradas: carpetas y archvios raíz, hijos por carpeta
    const rootFolders = documents.filter(d => d.type === 'folder' && d.parentId === null);
    const rootFiles = documents.filter(d => d.type === 'file' && d.parentId === null);
    const getChildren = (folderId: string) => documents.filter(d => d.parentId === folderId);

    //Utilidad para fecha legible
    const formatDate = (date: string) => {
        try {
            return format(new Date(date), "d MMM yyyy", {locale: es}); 
        } catch {
            return date;
        }
    };
    
    //Utilidad para tamaño de archivo en unidades humanas
    const formatBytes = (bytes: number) => {
        if(bytes === 0) return '0 B';
        const units = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return (bytes / Math.pow(1024, i)).toFixed(1) + ' ' + units[i];
    };

    //Renderiza una fila de archivo: icono, nombre, descripción, fecha y acciones(editar/eliminar) si es admin
    const renderFileRow = (doc: DocItem, indent = false) => (
        <div
            key={doc.id}
            className={`flex items-center gap-3 px-4 py-3 hover:bg-gray-50 rounded-lg cursor-pointer group ${indent ? 'ml-8' : ''}`}
            onClick={() => doc.url && setViewerModal({open: true, url: doc.url, name: doc.name})}
            draggable={isAdmin}
            onDragStart={(e) => handleDragStart(e, doc)}
        >
            <FileText className='h-5 w-5 text-red-400 flex-shrink-0' />
            <div className='flex-1 min-w-0'>
                <p className="text-sm font-medium text-gray-900 truncate">{doc.name}</p>
                {doc.description && <p className='text-xs text-gray-400 truncate'>{doc.description}</p>}
            </div>
            <span className='text-xs text-gray-400 flex-shrink-0'>{formatDate(doc.createdAt)}</span>
            {isAdmin && (
                <div className='flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0' onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className='h-7 w-7 text-gray-400 hover:text-blue-600' onClick={() => setEditModal({open: true, docId: doc.id, name: doc.name, description: doc.description, type: doc.type})}>
                        <Pencil className='h-3.5 w-3.5' />
                    </Button>
                    <Button variant="ghost" size="icon" className='h-7 w-7 text-gray-400 hover:text-red-600' onClick={() => setConfirmAction({ isOpen: true, type: 'delete', docId: doc.id, docType: doc.type, title: 'Eliminar Documento', message: `¿Eliminar el documento "${doc.name}"?`})}>
                        <Trash2 className='h-3.5 w-3.5' />
                    </Button>
                </div>
            )}
        </div>
    );

    //Renderiza una carpeta expandible con sus hijos recursivamente, soporte drag & drop y acciones admin
    const renderFolder = (folder: DocItem, nested = false) => {
        const isExpanded = expandedFolders.has(folder.id);
        const children = getChildren(folder.id);
        const isDragOver = dragOverFolderId === folder.id;

        return (
            <div key={folder.id} className={nested ? 'ml-8' : ''}>
                <div 
                    className={`flex items-center gap-3 px-4 py-3 hover:bg-gray-50 rounded-lg cursor-pointer group transition-all ${isDragOver ? 'bg-blue-50 ring-2 ring-blue-400 ring-dashed' : ''}`} 
                    onClick={() => toggleFolder(folder.id)}
                    draggable={isAdmin}
                    onDragStart={(e) => handleDragStart(e, folder)}
                    onDragOver={(e) => {e.preventDefault(); e.stopPropagation(); setDragOverFolderId(folder.id); setDragOverRoot(false);}}
                    onDragLeave={() => setDragOverFolderId(null)}
                    onDrop={(e) => handleDropOnFolder(e, folder.id)}
                >
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
                            <Button variant="ghost" size="icon" className='h-7 w-7 text-gray-400 hover:text-yellow-600' title='Nueva subcarpeta' onClick={() => {setCreateInFolderId(folder.id); setFolderModalOpen(true);}}>
                                <FolderPlus className='h-3.5 w-3.5' />
                            </Button>
                            <Button variant="ghost" size="icon" className='h-7 w-7 text-gray-400 hover:text-green-600' title='Subir archivo aquí' onClick={() => {setCreateInFolderId(folder.id); setDocumentModalOpen(true);}}>
                                <FilePlus className='h-3.5 w-3.5' />
                            </Button>
                            <Button variant="ghost" size="icon" className='h-7 w-7 text-gray-400 hover:text-blue-600' onClick={() => setEditModal({open: true, docId: folder.id, name: folder.name, type: folder.type})}>
                                <Pencil className='h-3.5 w-3.5' />
                            </Button>
                            <Button variant="ghost" size="icon" className='h-7 w-7 text-gray-400 hover:text-red-600' onClick={() => setConfirmAction({ isOpen: true, type: 'delete', docId: folder.id, docType: folder.type, title: 'Eliminar Carpeta', message: `¿Eliminar la carpeta "${folder.name}"?`})}>
                                <Trash2 className='h-3.5 w-3.5' />
                            </Button>
                        </div>
                    )}
                </div>
                {isExpanded && (
                    <div className='border-l-2 border-gray-100 ml-6'>
                        {children.length > 0 ? children.map(child =>child.type === 'folder' ? renderFolder(child, true) : renderFileRow(child, true)) : <p className='text-xs text-gray-400 py-2 ml-12'>Carpeta vacía</p>}
                    </div>
                )}
            </div>
        );
    };

    //Porcentaje de almacenamiento usado (para la barra de capacidad)
    const storage = storageInfo ? Math.min((storageInfo.usedBytes / storageInfo.quotaBytes) * 100, 100) : 0;

    return (
        <div>
            <Header showCommunutySwitcher={true} navLinks={[
                {label: <><Menu className='h-4 w-4 inline mr-1' /> Comunidad</>, path: "#", onClick: () => setSidebarOpen(true)},
                {label: "Calendario", path: "/calendar"},
                {label: "Ayuda", path: "/help"}
            ]}/>
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)}/>
                
            <main className='max-w-[700px] mx-auto pt-[250px] md:pt-[200px] px-4 md:px-0 pb-16' onDragEnd={() => {setIsDragging(false); setDragOverFolderId(null); setDragOverRoot(false);}}>
                <h1 className='text-[28px] font-bold mb-7 text-center'>Documentos</h1>
                {/*Botones de creación: nueva carpeta y subir documento (solo admin)*/}
                {isAdmin && (
                    <div className='flex gap-3 mb-6'>
                        <Button size="sm" variant="outline" onClick={() => {setCreateInFolderId(null); setFolderModalOpen(true)}}>
                            <FolderPlus className='h-4 w-4 mr-2'/> Nueva carpeta
                        </Button>
                        <Button size="sm" onClick={() => {setCreateInFolderId(null); setDocumentModalOpen(true)}}>
                            <Upload className='h-4 w-4 mr-2' /> Subir documento
                        </Button>
                    </div>
                )}

                {/*Árbol de documentos: carpetas expandibles + archivos, con drag & drop para reordendar*/}
                <div 
                    className='bg-white rounded-2xl border border-gray-200 shadow-sm divide-y divide-gray-100'
                    onDragOver={(e) => {e.preventDefault();}}
                    onDragEnter={(e) => {e.preventDefault(); setDragOverRoot(true);}}
                    onDragLeave={(e) => {if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOverRoot(false);}}
                    onDrop={handleDropOnRoot}
                >
                    {loading && documents.length === 0 && <p className='text-sm text-gray-400 text-center py-8'>Cargando documentos...</p>}
                    {!loading && documents.length === 0 && <p className='text-sm text-gray-400 text-center py-8'>No hay documentos ni carpetas.</p>}
                    {rootFolders.map(folder => renderFolder(folder))}
                    {rootFiles.map(file => renderFileRow(file))}
                </div>

                {/*Zona de frop para mover elementos a la raíz*/}
                {isAdmin && isDragging && (
                    <div
                        className={`mt-4 border-2 border-dashed rounded-xl py-6 text-center text-sm transition-all ${dragOverRoot ? 'border-blue-400 bg-blue-50 text-blue-600' : 'border-gray-300 text-gray-400'}`}
                        onDragOver={(e) => {e.preventDefault(); setDragOverRoot(true);}}
                        onDragEnter={(e) => {e.preventDefault(); setDragOverRoot(true);}}
                        onDragLeave={(e) => {if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOverRoot(false);}}
                    onDrop={handleDropOnRoot}
                    >
                        Soltar aquí para mover a la raíz
                    </div>
                )}
            </main>

            {/* Barra de capacidad */}
            {storageInfo && (
                <div className='fixed bottom-0 left-0 w-full bg-white/95 backdrop-blur border-t border-gray-200 z-40'>
                    <div className='max-w-[700px] mx-auto flex items-center gap-3 px-4 py-2.5'>
                        <HardDrive className='h-4 w-4 text-gray-400 flex-shrink-0' />
                        <div className='flex-1 bg-gray-200 rounded-full h-2 overflow-hidden'>
                            <div className={`h-2 rounded-full transition-all duration-500 ${storage > 90 ? 'bg-red-500' : storage > 70 ? 'bg-yellow-500' : 'bg-blue-500'}`} style={{width: `${storage}%`}}/>
                        </div>
                        <span className='text-xs text-gray-500 flex-shrink-0 whitespace-nowrap'>
                            {formatBytes(storageInfo.usedBytes)} / {formatBytes(storageInfo.quotaBytes)} ({storage.toFixed(1)}%)
                        </span>
                    </div>
                </div>
            )}

            {/*Modales: crear carpeta, subir documento, editar, visor, feedback y confirmación*/}
            <CreateFolderModal
                isOpen={folderModalOpen} 
                onClose={() => setFolderModalOpen(false)}
                communityId={communityId!}
                parentId={createInFolderId}
                onSuccess={loadDocuments}
            />

            <CreateDocumentModal
                isOpen={documentModalOpen} 
                onClose={() => setDocumentModalOpen(false)}
                communityId={communityId!}
                folderId={createInFolderId}
                onSuccess={loadDocuments}
            />

            <EditDocumentModal
                isOpen={editModal.open} 
                onClose={() => setEditModal({open: false, docId: '', name: '', type: ''})}
                communityId={communityId!}
                docId={editModal.docId}
                currentName={editModal.name}
                type={editModal.type}
                onSuccess={loadDocuments}
                currentDescription={editModal.description}
            />

            <DocumentViewerModal
                isOpen={viewerModal.open} 
                onClose={() => setViewerModal({open: false, url: '', name: ''})}
                documentUrl ={viewerModal.url}
                documentName={viewerModal.name}
            />

            <FeedbackModal 
                isOpen={feedback.isOpen}
                type={feedback.type}
                message={feedback.message}
                onClose={closeFeedback}
            />

            <ConfirmModal
                isOpen={confirmAction.isOpen}
                onClose={() => setConfirmAction({...confirmAction, isOpen: false})}
                title={confirmAction.title}
                message={confirmAction.message}
                isDestructive={true}
                confirmText='Sí, eliminar'
                onConfirm={async () => {
                    if(confirmAction.type === 'delete') await handleDelete(confirmAction.docId, '', confirmAction.docType);
                }}
            />
        </div>
    );

};

export default DocumentsPage;
