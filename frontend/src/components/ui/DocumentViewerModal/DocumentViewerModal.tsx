//Modal visor de documentos PDF con opciones de descarga y nueva pestaña
import React from "react";
import {Dialog, DialogContent, DialogHeader, DialogTitle} from '../dialog';
import { Button } from '../button';
import { Download, ExternalLink, X } from "lucide-react";

interface DocumentViewerModalProps {
    isOpen: boolean;
    onClose: () => void;
    documentUrl: string;
    documentName: string;
}

const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({isOpen, onClose, documentUrl, documentName}) => {
    //Generea un enlace temporal para descargar el documento
    const handleDownload = () => {
        const link = document.createElement('a');
        link.href = documentUrl;
        link.download = documentName;
        link.target = '_blank';
        link.click();
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-[90vw] w-[900px] h-[85vh] flex flex-col p-0">
                <DialogHeader className="px-6 pt-5 pb-3 border-b border-gray-200 flex-shrink-0">
                    <div className="flex items-center justify-between w-full">
                        <DialogTitle className="text-lg truncate pr-4">{documentName}</DialogTitle>
                        <div className="flex items-center gap-2 flex-shrink-0">
                            <Button variant="outline" size="sm" onClick={handleDownload}>
                                <Download className="h-4 w-4 mr-2"/> Descargar
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => window.open(documentUrl, '_blank')}>
                                <ExternalLink className="h-4 w-4 mr-2"/> Nueva pestaña
                            </Button>
                        </div>
                    </div>
                </DialogHeader>
                <div className="flex-1 min-h-0 p-1">
                    <iframe src={documentUrl} className="w-full h-full rounded-md border border-gray-100" title={documentName} />
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default DocumentViewerModal;