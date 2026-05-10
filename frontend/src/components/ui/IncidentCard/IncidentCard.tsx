//Tarjeta de incidencia: muestra estado, imagen, fechas y acciones según rol
import React from 'react';
import {Button} from '@/components/ui/button';
import {Pencil, Trash2, ArrowRightLeft} from 'lucide-react';
import { formatUtcIsoInBusinessZone } from '@/lib/businessDateTime';
import { IncidentStatus } from '@/services/incidentService';

//Configuración visual de cada estado de incidencia (color y etiqueta)
const statusConfig: Record<IncidentStatus, {label: string; bg: string; text: string}> = {
    pending: {label: 'Pendiente', bg: 'bg-yellow-100', text: 'text-yellow-700'},
    inProgress: {label: 'En proceso', bg: 'bg-blue-100', text: 'text-blue-700'},
    resolved: {label: 'Resuelta', bg: 'bg-green-100', text: 'text-green-700'},
    cancelled: {label: 'Cancelada', bg: 'bg-red-100', text: 'text-red-700'},

}

interface IncidentCardProps {
    id: string;
    title: string;
    description: string;
    status: IncidentStatus;
    imageUrl: string | null;
    authorAlias: string | null;
    createdAt: string;
    editedAt: string | null;
    isAdmin: boolean;
    isOwner: boolean;
    onEdit: () => void;
    onDelete: () => void;
    onChangeStatus: () => void;
}

const IncidentCard: React.FC<IncidentCardProps> = ({title, description, status, imageUrl, authorAlias, createdAt, editedAt, isAdmin, isOwner, onEdit, onDelete, onChangeStatus}) => {
    
    const st = statusConfig[status];
    //Solo el propietario puede editar y solo si la incidencia esta en estado pendiente
    const isPending = status === 'pending';
    const formatteDate = createdAt ? formatUtcIsoInBusinessZone(createdAt, "d 'de' MMMM 'de' yyyy, HH:mm") : '';
    const formatteEditedAt = editedAt ? formatUtcIsoInBusinessZone(editedAt, "d 'de' MMMM 'de' yyyy, HH:mm") : null;


    return (
        <div className='bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col gap-4'>
            <div className='flex justify-between items-start border-b border-gray-50 pb-3'>
                <div className="flex items-center gap-3 flex-wrap">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${st.bg} ${st.text}`}>{st.label}</span>
                    <span className='text-sm text-gray-400'>•</span>
                    <p className='text-sm text-gray-500 font-medium'>{formatteDate}</p>
                    {authorAlias && (
                        <>
                            <span className='text-sm text-gray-400'>•</span>
                            <p className='text-sm text-gray-500 font-medium'>por {authorAlias}</p>
                        </>
                    )}
                    {formatteEditedAt && (
                        <>
                            <span className='text-sm text-gray-400'>•</span>
                            <p className='text-sm text-gray-400 font-medium italic'>Editado: {formatteEditedAt}</p>
                        </>
                    )}
                </div>

                <div className='flex gap-1'>
                    {/*Acciones: cambiar estado (admin), editar(propietario), eliminar (admin o propietario)*/}
                    {isAdmin && (
                        <Button variant="ghost" size="icon" onClick={onChangeStatus} className='h-8 w-8 text-gray-500 hover_text-purple-600' title="Cambiar estado">
                            <ArrowRightLeft className='h-4 w-4'/>
                        </Button>
                    )}
                    {(isOwner && isPending) && (
                        <Button variant="ghost" size="icon" onClick={onEdit} className='h-8 w-8 text-gray-500 hover:text-blue-600'>
                            <Pencil className='h-4 w-4' />
                        </Button>
                    )}
                    {(isAdmin || (isOwner && isPending)) && (
                        <Button variant="ghost" size="icon" onClick={onDelete} className='h-8 w-8 text-gray-500 hover:text-red-600'>
                            <Trash2 className='h-4 w-4' />
                        </Button>
                    )}
                </div>
            </div>

            <div className='pt-1'>
                <h3 className='text-xl font-bold text-gray-900 mb-2'>{title}</h3>

                {imageUrl && (
                    <div className='pt-2 pb-2'>
                        <img src={imageUrl} alt="title" className='w-full max-h-[350px] object-cover rounded-lg border border-gray-100' />
                    </div>
                )}

                <p className='text-gray-700 whitespace-pre-wrap text-sm leading-relaxed'>{description}</p>
            </div>
        </div>
    );
};

export default IncidentCard;