//Tarjeta de noticia/evento: muestra título, contenido, imagen, fechas y acciones de admin
import React from 'react';
import {Button} from '@/components/ui/button';
import {Pencil, Trash2, Megaphone, Calendar} from 'lucide-react';
import { formatUtcIsoInBusinessZone } from '@/lib/businessDateTime';

interface NewsCardProps {
    id: string;
    title: string;
    content: string;
    createdAt: string;
    editedAt?: string | null;
    authorAlias?: string | null;
    imageUrl?: string;
    isAdmin: boolean;
    onEdit: () => void;
    onDelete: () => void;
    isEvent?: boolean;
    eventStartDate?: string;
    eventStartTime?: string;
    eventEndDate?: string;
    eventEndTime?: string;
}

const NewsCard: React.FC<NewsCardProps> = ({title, content, createdAt, editedAt, authorAlias, imageUrl, isAdmin, onEdit, onDelete,  isEvent, eventStartDate, eventStartTime, eventEndDate, eventEndTime,}) => {
    //Formatea las fechas UTC a zona de negocio para mostrarlas en formato legible
    const formatteDate = createdAt ? formatUtcIsoInBusinessZone(createdAt, "d 'de' MMMM 'de' yyyy, HH:mm") : '';
    const formatteEditedAt = editedAt ? formatUtcIsoInBusinessZone(editedAt, "d 'de' MMMM 'de' yyyy, HH:mm") : null;


    return (
        <div className='bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col overflow-hidden'>
            <div className='flex justify-between items-start p-6 border-b border-gray-50 pb-3'>
                <div className="flex items-center gap-3 flex-wrap">
                    {/*Etiqueta de tipo: "Evento" (morado) o "Comunicado Oficial" (azul)*/}
                    {isEvent ? (
                        <div className='px-3 py-1.5 rounded-full bg-purple-50/50 border border-purple-100 text-purple-700 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5'>
                            <Calendar className='w-3.5 h-3.5'/> Evento
                        </div>
                    ) : (
                        <div className="px-3 py-1.5 rounded-full bg-blue-50/50 border border-blue-100 text-blue-700 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                            <Megaphone className='w-3.5 h-3.5' /> Comunicado Oficial
                        </div>
                    )}

                    <span className='text-sm font-medium text-gray-400'>•</span>

                    <p className='text-sm text-gray-500 font-medium'>{formatteDate}</p>

                    {authorAlias && (
                        <>
                            <span className='text-sm font-medium text-gray-400'>•</span>
                            <p className='text-sm text-gray-500 font-medium'>por {authorAlias}</p>
                        </>
                    )}

                    {formatteEditedAt && (
                        <>
                            <span className='text-sm font-medium text-gray-400'>•</span>
                            <p className='text-sm text-gray-400 font-medium italic'>Editado: {formatteEditedAt}</p>
                        </>
                    )}
                </div>

                {/*Botones de editar y eliminar solo viisbles para administradores*/}
                {isAdmin && (
                    <div className='flex gap-2'>
                        <Button variant="ghost" size="icon" onClick={onEdit} className='h-8 w-8 text-gray-500 hover:text-blue-600'>
                            <Pencil className='h-4 w-4'/>
                        </Button>
                        <Button variant="ghost" size="icon" onClick={onDelete} className='h-8 w-8 text-gray-500 hover:text-red-600'>
                            <Trash2 className='h-4 w-4'/>
                        </Button>
                    </div>
                )}
            </div>

            <div className='px-6 pt-4'>
                {/*Banner con las fechas del evento si aplica*/}
                {isEvent && eventStartDate && (
                    <div className='flex items-center text-sm font-medium text-purple-700 bg-purple-50 p-3 rounded-lg border border-purple-100 mb-2 w-fit'>
                        <Calendar className='w-4 h-4 mr-2 shrink-0' />
                        <span>
                            {eventStartDate.split('-').reverse().join('/')} {eventStartTime && `a las ${eventStartTime}`}
                            {eventEndDate && ` - ${eventEndDate.split('-').reverse().join('/')}`} {eventEndTime && `a las ${eventEndTime}`}
                        </span>
                    </div>
                )}
                <h3 className='text-xl font-bold text-gray-900 mb-3'>{title}</h3>
    
            </div>

            {imageUrl && (
                <div className='px-6 pt-3'>
                    <img src={imageUrl} alt="title" className='w-full max-h-[350px] object-cover rounded-lg border border-gray-100' />
                </div>
            )}

            <div className="px-6 pt-3 pb-6">
                <div className='text-gray-700 whitespace-pre-wrap text-sm leading-relaxed'>
                    {content}
                </div>
            </div>
        </div>
    );
};

export default NewsCard;