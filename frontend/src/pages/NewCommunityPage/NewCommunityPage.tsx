import React from 'react';
import Header from '../../components/common/Header/Header';
import { useState } from 'react';

import './NewCommunityPage.css';

const NewCommunityPage: React.FC = () => {
const [opcion, setOpcion] = useState('');

    return (
        <div>
            <Header
                navLinks={[
                    {label: "Ayuda", path: "/help"}
                ]}
             />

            <main className="container">
                <h2 className='titulo-perfil'>Nueva Comunidad</h2>
                <div className="contorno new-community-section mt-5">
                    <div className="row">
                        <h3 className='fw-bold ms-5 mt-5'>¿Cómo vas a conectar?</h3>
                        <p className='p-info-comunidad ms-5'>Selecciona una de las dos opciones.</p>

                        <div className={`option-card col-5 ms-5 mt-3 mb-5 ${opcion === 'unete' ? 'selected' : ''}`} onClick={() => setOpcion('unete')}>
                            <h5 className="subtitle-com fw-bold">Únete a una comunidad existente</h5>
                            <p className="parrafo-com">Introduce el código de iinvitación proporcionado por el presidente de la comunidad para formar parte d ella de inmediato.</p>
                            <input type="radio" className="radio-custom" checked={opcion === 'unete'} readOnly/>
                        </div>

                        <div className={`option-card col-5 ms-5 mt-3 mb-5 ${opcion === 'crear' ? 'selected' : ''}`} onClick={() => setOpcion('crear')}>
                            <h5 className="subtitle-com fw-bold">Crea una nueva comunidad</h5>
                            <p className="parrafo-com">Inicia una comunidad desde cero. Configura sus detalles y conviertete en su presidente para invitar a otros miembros.</p>
                            <input type="radio" className="radio-custom" checked={opcion === 'crear'} readOnly/>
                        </div>
                    </div>
                </div>

                {opcion === 'unete' && (
                    <div className="contorno new-community-section mt-5">
                        <h3 className='fw-bold ms-5 mt-5'>Código de Registro</h3>
                        <p className='p-info-comunidad ms-5'>Por favor, contacta con tu presidente y/o administrador y obtén tu código de registro.</p>

                        <div className='mb-3 ms-5 me-5'>
                            <label htmlFor="codigo" className='form-label fw-semibold'>Introduce tu código de registro</label>
                            <input type="text" className='form-control' id='codigo'/>
                        </div>

                        <button className='btn btn-secondary btn-validate d-block mx-auto mt-5 mb-5' onClick={() => setOpcion('registro-vivienda')}>Validar</button>
                        
                    </div>
                )}

                {opcion === 'crear' && (
                    <div className="contorno new-community-section mt-5">
                        <h3 className='fw-bold ms-5 mt-5'>Datos de la comunidad</h3>
                        <p className='p-info-comunidad ms-5'>Por favor, introduzca los datos de su comunidad de vecinos.</p>

                        <div className="ms-5 me-5 mb-4">
                            <div className="row">
                                <div className="mb-3 col-7">
                                    <label htmlFor="nombre" className="form-label">Nombre de la comunidad</label>
                                    <input type="text" className="form-control" id="nombre"/>
                                </div>
                                <div className="mb-3 col-4">
                                    <label htmlFor="cif" className="form-label">C.I.F.</label>
                                    <input type="text" className="form-control" id='cif'/>
                                </div>
                            </div>

                            <h5 className="fw-bold mt-4">Ubicación</h5>

                            <div className="row">
                                <div className="mb-3 col-3">
                                    <label htmlFor="pais" className="form-label">País</label>
                                    <input type="text" className="form-control" id='pais' />
                                </div>
                                <div className="mb-3 col-3">
                                    <label htmlFor="provincia" className="form-label">Provincia</label>
                                    <input type="text" className="form-control" id='provincia' />
                                </div>
                                <div className="mb-3 col-5">
                                    <label htmlFor="municipio" className="form-label">Municipio</label>
                                    <input type="text" className="form-control" id='municipio' />
                                </div>
                            </div>

                            <div className="row">
                                <div className="mb-3 col-6">
                                    <label htmlFor="tipo-via" className="form-label">Tipo de vía</label>
                                    <input type="text" className="form-control" id='tipo-via' />
                                </div>
                                <div className="mb-3 col-5">
                                    <label htmlFor="nombre-via" className="form-label">Nombre de la vía</label>
                                    <input type="text" className="form-control" id='nombre-via' />
                                </div>
                            </div>

                            <div className="row">
                                <div className="mb-3 col-3">
                                    <label htmlFor="cp" className="form-label">Código Postal</label>
                                    <input type="text" className="form-control" id='cp' />
                                </div>
                                <div className="mb-3 col-3">
                                    <label htmlFor="numero" className="form-label">Número</label>
                                    <input type="text" className="form-control" id='numero' />
                                </div>
                            </div>

                        </div>

                        <button className='btn btn-secondary btn-validate d-block mx-auto mt-5 mb-5' onClick={() => setOpcion('registro-vivienda')}>Validar</button>
                        
                    </div>
                )}

                {opcion === 'registro-vivienda' && (
                    <div className="contorno new-community-section mt-5">
                        <h3 className="fw-bold ms-5 mt-5">Datos de tu domicilio</h3>
                        <p className='p-info-comunidad ms-5'>Introduce los datos de tu vivienda perteneciente a la comunidad anterior.</p>

                        <div className="ms-5 me-5 mb-4">
                            <div className="row">
                                 <div className="mb-3 col-3">
                                    <label htmlFor="pais" className="form-label">País</label>
                                    <input type="text" className="form-control" id="pais"/>
                                </div>
                                <div className="mb-3 col-3">
                                    <label htmlFor="provincia" className="form-label">Provincia</label>
                                    <input type="text" className="form-control" id='provincia'/>
                                </div>
                                <div className="mb-3 col-6">
                                    <label htmlFor="municipio" className="form-label">Municipio</label>
                                    <input type="text" className="form-control" id='municipio'/>
                                </div>
                            </div>

                            <div className="row">
                                <div className="mb-3 col-6">
                                    <label htmlFor="tipo-via" className="form-label">Tipo de vía</label>
                                    <input type="text" className="form-control" id='tipo-via'/>
                                </div>
                                <div className="mb-3 col-6">
                                    <label htmlFor="nombre-via" className="form-label">Nombre de la vía</label>
                                    <input type="text" className="form-control" id='nombre-via'/>
                                </div>
                            </div>

                            <div className="row">
                                <div className="mb-3 col-2">
                                    <label htmlFor="cp" className="form-label">C.P.</label>
                                    <input type="text" className="form-control" id='cp'/>
                                </div>
                                <div className="mb-3 col-2">
                                    <label htmlFor="numero" className="form-label">Nº</label>
                                    <input type="text" className="form-control" id='numero'/>
                                </div>
                                <div className="mb-3 col-2">
                                    <label htmlFor="bloque" className="form-label">Bloque</label>
                                    <input type="text" className="form-control" id='bloque'/>
                                </div>
                                <div className="mb-3 col-3">
                                    <label htmlFor="planta" className="form-label">Planta</label>
                                    <input type="text" className="form-control" id='planta'/>
                                </div>
                                <div className="mb-3 col-3">
                                    <label htmlFor="puerta" className="form-label">Puerta</label>
                                    <input type="text" className="form-control" id='puerta'/>
                                </div>
                            </div>
                        </div>
                        <button className='btn btn-secondary d-block mx-auto mt-5 mb-5'>Confirmar</button>
                    </div>

                    
                )}

            </main>
        </div>
    );


};


export default NewCommunityPage;

