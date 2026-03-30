import React, {useState} from "react";
import {Button} from '@/components/ui/button';
import { CircleUserRound, X, Plus } from "lucide-react";

type PostCategory = 'pregunta' | 'encuesta' | 'anuncio' | 'solicitud';

interface CreatePostProps{
    userAvatar?: string;
    onSubmit: (content: string, category: PostCategory, pollOptions?: string[]) => void;
}

const CreatePost: React.FC<CreatePostProps> = ({userAvatar, onSubmit}) => {
    const [content, setContent] = useState('');
    const [category, setCategory] = useState<PostCategory>('pregunta');
    const [pollOptions, setPollOptions] = useState<string[]>(['', '']);

    const handleSubmit = () => {
        if(content.trim()){
            if(category === 'encuesta'){
                const validOptions = pollOptions.filter(opt => opt.trim());
                if(validOptions.length >= 2){
                    onSubmit(content, category, validOptions);
                }
            }
            else{
                onSubmit(content, category);
            }
            setContent('');
            setPollOptions(['','']);
        }
    };

    const updatePollOption = (index: number, value: string) => {
        const newOptions = [...pollOptions];
        newOptions[index] = value;
        setPollOptions(newOptions);
    };

    const addPollOption = () =>{
        if(pollOptions.length < 5){
            setPollOptions([...pollOptions, '']);
        }
    };

    const removePollOption = (index: number) => {
        if(pollOptions.length > 2){
            setPollOptions(pollOptions.filter((_, i) => i != index));
        }
    };

    return (
        <div className="flex gap-3 bg-white rounded-2xl p-5 mb-5 shadow-sm">
            <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center shrink-0">
                {userAvatar ? (
                    <img src={userAvatar} alt="Tu avatar" className="w-full h-full object-cover" />
                ) : (
                    <CircleUserRound className="h-8 w-8 text-gray-400"/>
                )}
            </div>
            <div className="flex-1 min-w-0">
                <textarea 
                placeholder=  { category === 'encuesta' ? '¿Cúal es tu pregunta para la encuesta?' : "¿Qué quieres compartir con tu comunidad?"} 
                value={content} 
                onChange={(e) => setContent(e.target.value)} 
                rows={3}
                className="w-full border border-gray-200 rounded-xl p-3 resize-none text-sm focus:outline-none focus:border-[#104084]"/>

                {category === 'encuesta' && (
                    <div className="mt-3">
                        {pollOptions.map((option, index) => (
                            <div className="flex gap-2 mb-2" key={index}>
                                <input type="text" placeholder={`Opción ${index + 1}`}
                                value={option}
                                onChange={(e) => updatePollOption(index, e.target.value)}
                                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#104084]" />
                                {pollOptions.length > 2 && (
                                    <button className="px-2 text-red-500 bg-transparent border-none cursor-pointer" onClick={() => removePollOption(index)}><X className="h-4 w-4"/></button>
                                )}
                            </div>
                        ))}
                        {pollOptions.length < 5 && (
                            <button className="w-full py-2 px-3 border border-dashed border-gray-400 text-gray-500 rounded-lg text-sm bg-transparent cursor-pointer hover:border-[#104084] hover:text-[#104084]" onClick={() => addPollOption()}><Plus className="h-4 w-4 inline mr-1"/>Añadir opción</button>
                        )}
                    </div>
                )}

                <div className="flex justify-end gap-2.5 mt-2.5">
                    <select
                        className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:border-[#104084]" 
                        value={category} 
                        onChange={(e) => setCategory(e.target.value as PostCategory)}>
                        <option value="pregunta">❓ Pregunta</option>
                        <option value="encuesta">📊 Encuesta</option>
                        <option value="anuncio">📢 Anuncio</option>
                        <option value="solicitud">🙋 Solicitud</option>
                    </select>
                    <Button size="sm" onClick={handleSubmit} disabled={!content.trim()}>Publicar</Button>
                </div>
            </div>
        </div>
    );
};

export default CreatePost;
