import React, {useState} from "react";
import './CreatePost.css';

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
        <div className="create-post">
            <div className="create-post-avatar">
                {userAvatar ? (
                    <img src={userAvatar} alt="Tu avatar" />
                ) : (
                    <i className="bi bi-person-circle"></i>
                )}
            </div>
            <div className="create-post-input">
                <textarea name="" id="" placeholder=  { category === 'encuesta' ? '¿Cúal es tu pregunta para la encuesta?' : "¿Qué quieres compartir con tu comunidad?"} value={content} onChange={(e) => setContent(e.target.value)} rows={3}/>

                {category === 'encuesta' && (
                    <div className="poll-options">
                        {pollOptions.map((option, index) => (
                            <div className="poll-option-row" key={index}>
                                <input type="text" placeholder={`Opción ${index + 1}`}
                                value={option}
                                onChange={(e) => updatePollOption(index, e.target.value)} />
                                {pollOptions.length > 2 && (
                                    <button className="btn-remove-option" onClick={() => removePollOption(index)}><i className="bi bi-x"></i></button>
                                )}
                            </div>
                        ))}
                        {pollOptions.length < 5 && (
                            <button className="btn-add-option" onClick={() => addPollOption()}><i className="bi bi-plus"></i>Añadir opción</button>
                        )}
                    </div>
                )}

                <div className="create-post-actions">
                    <select name="" id="" className="form-select form-select-sm category-select" value={category} onChange={(e) => setCategory(e.target.value as PostCategory)}>
                        <option value="pregunta">❓ Pregunta</option>
                        <option value="encuesta">📊 Encuesta</option>
                        <option value="anuncio">📢 Anuncio</option>
                        <option value="solicitud">🙋 Solicitud</option>
                    </select>
                    <button className="btn btn-primary btm.sm" onClick={handleSubmit} disabled={!content.trim()}>Publicar</button>
                </div>
            </div>
        </div>
    );
};

export default CreatePost;
