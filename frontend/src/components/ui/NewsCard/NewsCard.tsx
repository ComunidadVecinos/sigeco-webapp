import React from 'react';
import {Button} from '@/components/ui/button';
import {Pencil, Trash2, Megaphone} from 'lucide-react';
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
}

const NewsCard: React.FC<NewsCardProps> = ({title, content, createdAt, editedAt, authorAlias, imageUrl, isAdmin, onEdit, onDelete}) => {
    
    const formatteDate = createdAt ? formatUtcIsoInBusinessZone(createdAt, "d 'de' MMMM 'de' yyyy, HH:mm") : '';
    const formatteEditedAt = editedAt ? formatUtcIsoInBusinessZone(editedAt, "d 'de' MMMM 'de' yyyy, HH:mm") : null;


    return (
        <div className='bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col overflow-hidden'>
            <div className='flex justify-between items-start p-6 border-b border-gray-50 pb-3'>
                <div className="flex items-center gap-3 flex-wrap">
                    <div className="px-3 py-1.5 rounded-full bg-blue-50/50 border border-blue-100 text-blue-700 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                        <Megaphone className='w-3.5 h-3.5' /> Comunicado Oficial
                    </div>
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