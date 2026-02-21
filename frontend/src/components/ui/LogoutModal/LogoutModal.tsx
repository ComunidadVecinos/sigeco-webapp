import React from "react";
import {Dialog, DialogContent, DialogFooter} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

interface LogoutModalProps{
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

const LogoutModal: React.FC<LogoutModalProps> = ({isOpen, onClose, onConfirm}) => {

    return(
        <Dialog open={isOpen} onOpenChange={(open) => {if(!open) onClose(); }}>
           <DialogContent className="sm:max-w-xs">
                <div className="text-center py-4">
                    <LogOut className="h-12 w-12 text-red-500 mx-auto"></LogOut>
                    <h5 className="font-bold mt-3">¿Cerrar sesión?</h5>
                    <p className="text-muted-foreground text-sm">Tendrás que volver a iniciar sesión para acceder a tu cuenta.</p>
                </div>
                <DialogFooter>
                    <Button variant="secondary" size="sm" onClick={onClose}>Cancelar</Button>
                    <Button variant="destructive" size="sm" onClick={onConfirm}>Cerrar Sesión</Button>                    
                </DialogFooter>
           </DialogContent>
        </Dialog>
    );
};

export default LogoutModal;