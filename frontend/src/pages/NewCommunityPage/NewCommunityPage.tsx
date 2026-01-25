import React from 'react';
import Header from '../../components/common/Header/Header';
import { useState } from 'react';



const NewCommunityPage: React.FC = () => {
const [opcion, setOpcion] = useState('');

    return (
        <div>
            <Header
                navLinks={[
                    {label: "Nueva Comunidad", path: "/new-community"},
                    {label: "Ayuda", path: "/help"}
                ]}
             />

            <main className="container">
                <h2 className='titulo-perfil'>Nueva Comunidad</h2>
                <div className="contorno mt-5">
                    <div className="row">
                        <h3 className='fw-bold ms-5 mt-5'>¿Cómo vas a conectar?</h3>
                        <p className='p-info-comunidad ms-5'>Selecciona una de las dos opciones.</p>

                        <div className="contorno col-5 ms-5 mt-3 mb-5 text-start">
                            <h5 className='subtitle-com fw-bold m-3'>Unete a una comunidad existente</h5>
                            <p className='parrafo parrafo-com m-3'>Introduce el código de invitación proporcionado por el presidente de la comunidad para formar parte de ella de inmediato.</p>
                            <input type="radio" className='radio-custom' name='opcionComunidad' checked={opcion === 'unete'} onChange={() => setOpcion('unete')} />
                        </div>

                        <div className="contorno col-5 ms-5 mt-3 mb-5 text-start">
                            <h5 className='subtitle-com fw-bold m-3'>Crea una nueva comunidad</h5>
                            <p className='parrafo parrafo-com m-3'>Inicia una nueva comunidad desde cero. Configura sus detalles y conviértete en su presidente para invitar a otros miembros.</p>
                            <input type="radio" className='radio-custom' name='opcionComunidad' checked={opcion === 'crear'} onChange={() => setOpcion('crear')}/>
                        </div>
                    </div>
                </div>

                {opcion === 'unete' && (
                    <div className="contorno mt-5">
                        <h3 className='fw-bold ms-5 mt-5'>Código de Registro</h3>
                        <p className='p-info-comunidad ms-5'>Por favor, contacta con tu presidente y/o administrador y obtén tu código de registro.</p>

                        <div className='mb-3 ms-5 me-5'>
                            <label htmlFor="codigo" className='form-label fw-semibold'>Introduce tu código de registro</label>
                            <input type="text" className='form-control' id='codigo' />
                        </div>

                        <button className='btn btn-secondary d-block mx-auto mt-5 mb-5'>Validar</button>
                        
                    </div>
                )}

            </main>
        </div>
    );


};


export default NewCommunityPage;

