import React, {useState} from 'react';
import Header from '../../components/common/Header/Header';
import './NewCommunityPage.css';

const NewCommunityPage: React.FC = () => {
    const [opcion, setOpcion] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [touched, setTouched] = useState<Record<string, boolean>>({});
    const [codigo, setCodigo] = useState('');
    const [comunidad, setComunidad] = useState({
        nombre: '',
        cif: '',
        pais: '',
        provincia: '',
        municipio: '',
        tipoVia: '',
        nombreVia: '',
        cp: '',
        numero: ''
    });

    const [domicilio, setDomicilio] = useState({
        pais: '',
        provincia: '',
        municipio: '',
        tipoVia: '',
        nombreVia: '',
        cp: '',
        numero: '',
        bloque: '',
        planta: '',
        puerta: ''
    });

    const validateField = (name: string, value: string, context?: string): string | undefined => {
        switch(name){
            case 'codigo': 
                if (!value.trim()) return 'El código de registro es requerido';
                return undefined;
                
            case 'nombre': 
                if (!value) return 'El nombre de la comunidad es requerido';
                return undefined;
                
            case 'cif': 
                if (!value.trim()) return 'El CIF es requerido';
                if(!/^[A-Za-z]\d{8}$/.test(value)) return 'Formato: letra + 8 dígitos (ej: A12345678)';
                return undefined;
                
            case 'pais': 
                if (!value.trim()) return 'El país es requerido';
                return undefined;
                
            case 'provincia': 
                if (!value.trim()) return 'La provincia es requerida';
                return undefined;
                
            case 'municipio': 
                if (!value.trim()) return 'El municipio es requerido';
                return undefined;
                
            case 'tipoVia': 
                if (!value.trim()) return 'El tipo de vía es requerido';
                return undefined;
                
            case 'nombreVia': 
                if (!value.trim()) return 'El nombre de la vía es requerido';
                return undefined;
                
            case 'cp': 
                if (!value.trim()) return 'El código postal es requerido';
                if(!/^\d{5}$/.test(value)) return 'Debe tener 5 dígitos';
                return undefined;
                
            case 'numero': 
                if (!value.trim()) return 'El número es requerido';
                if(!/^\d+$/.test(value)) return 'Solo se permiten dígitos';
                return undefined;
                
            default:
                return undefined;
        }
    };

    //Validar codigo
    const validarCodigo = (): boolean => {
        const err = validateField('codigo', codigo);
        setErrors({codigo: err || ''});
        setTouched({codigo: true});
        return !err;
    };

    //Validar comunidad
    const validarComunidad = (): boolean => {
        const campos = ['nombre', 'cif', 'pais', 'provincia', 'municipio', 'tipoVia', 'nombreVia', 'cp', 'numero'];
        const newErrors: Record<string, string> = {};
        const newTouched: Record<string, boolean> = {};
        let valid = true;

        campos.forEach(campo => {
            const err = validateField(campo, (comunidad as any)[campo]);
            newTouched[`com_${campo}`] = true;
            if(err){
                newErrors[`com_${campo}`] = err;
                valid = false;
            }
        });

        setErrors(newErrors);
        setTouched(prev => ({...prev, ...newTouched}));
        return valid;
    };

    //Validar domicilio
    const validarDomicilio = (): boolean => {
        const camposRequeridos = ['pais', 'provincia', 'municipio', 'tipoVia', 'nombreVia', 'cp', 'numero'];
        const newErrors: Record<string, string> = {};
        const newTouched: Record<string, boolean> = {};
        let valid = true;

        camposRequeridos.forEach(campo => {
            const err = validateField(campo, (domicilio as any)[campo]);
            newTouched[`dom_${campo}`] = true;
            if(err){
                newErrors[`dom_${campo}`] = err;
                valid = false;
            }
        });

        setErrors(newErrors);
        setTouched(prev => ({...prev, ...newTouched}));
        return valid;
    };

    const handleValidarCodigo = () => {
        if(validarCodigo()){
            setErrors({});
            setTouched({});
            setOpcion('registro-vivienda');
        }
    };

    const handleValidarComunidad = () => {
        if(validarComunidad()){
            setErrors({});
            setTouched({});
            setOpcion('registro-vivienda');
        }
    };

    const handleConfirmarDomicilio = () => {
        if(validarDomicilio()) {
            console.log('Datos confirmados:', {codigo, comunidad,domicilio});
            alert('¡Comunidad registrada correctamente!');
        }
    };

    const handleComunidadChange = (campo: string, valor: string) => {
        setComunidad({ ...comunidad, [campo]: valor});
        if(touched[`com_${campo}`]){
            const err = validateField(campo, valor);
            setErrors(prev => ({...prev, [`com_${campo}`]: err || ''}));
        }
    };

    const handleComunidadBlur = (campo: string) => {
        setTouched(prev => ({...prev, [`com_${campo}`]: true}));
        const err = validateField(campo, (comunidad as any)[campo]);
        setErrors(prev => ({...prev, [`com_${campo}`]: err || ''}));
    }

    const handleDomicilioChange = (campo: string, valor: string) => {
        setDomicilio({ ...domicilio, [campo]: valor});
        if(touched[`dom_${campo}`]){
            const err = validateField(campo, valor);
            setErrors(prev => ({...prev, [`dom_${campo}`]: err || ''}));
        }
    };

    const handleDomicilioBlur = (campo: string) => {
        setTouched(prev => ({...prev, [`dom_${campo}`]: true}));
        const err = validateField(campo, (domicilio as any)[campo]);
        setErrors(prev => ({...prev, [`dom_${campo}`]: err || ''}));
    }

    const inputClass = (key: string): string => {
        if(!touched[key]) return 'form-control';
        return `form-control ${errors[key] ? 'is-invalid' : 'is-valid'}`;
    };

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

                        <div className={`option-card col-5 ms-5 mt-3 mb-5 ${opcion === 'unete' ? 'selected' : ''}`} onClick={() =>{ setOpcion('unete'); setErrors({}); setTouched({}); }}>
                            <h5 className="subtitle-com fw-bold">Únete a una comunidad existente</h5>
                            <p className="parrafo-com">Introduce el código de invitación proporcionado por el presidente de la comunidad para formar parte d ella de inmediato.</p>
                            <input type="radio" className="radio-custom" checked={opcion === 'unete'} readOnly/>
                        </div>

                        <div className={`option-card col-5 ms-5 mt-3 mb-5 ${opcion === 'crear' ? 'selected' : ''}`} onClick={() => { setOpcion('crear'); setErrors({}); setTouched({});}}>
                            <h5 className="subtitle-com fw-bold">Crea una nueva comunidad</h5>
                            <p className="parrafo-com">Inicia una comunidad desde cero. Configura sus detalles y conviértete en su presidente para invitar a otros miembros.</p>
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
                            <input type="text" className={inputClass('codigo')} id='codigo' value={codigo} onChange={(e) => {setCodigo(e.target.value); if (touched.codigo) {const err = validateField('codigo', e.target.value); setErrors(prev => ({...prev, codigo: err || ''})); }}}
                            onBlur={() => {setTouched(prev => ({...prev, codigo: true})); const err = validateField('codigo', codigo); setErrors(prev => ({...prev, codigo: err || ''}));}}/>
                            {touched.codigo && errors.codigo && <div className='invalid-feedback'>{errors.codigo}</div>}
                        </div>

                        <button className='btn btn-secondary btn-validate d-block mx-auto mt-5 mb-5' onClick={handleValidarCodigo}>Validar</button>
                        
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
                                    <input type="text" className={inputClass('com_nombre')} id="nombre" value={comunidad.nombre} onChange={(e) => handleComunidadChange('nombre', e.target.value)} onBlur={() => handleComunidadBlur('nombre')}/> 
                                    {touched.com_nombre && errors.com_nombre && <div className='invalid-feedback'>{errors.com_nombre}</div>}
                                </div>
                                <div className="mb-3 col-4">
                                    <label htmlFor="cif" className="form-label">C.I.F.</label>
                                    <input type="text" className={inputClass('com_cif')} id='cif' value={comunidad.cif} onChange={(e) => handleComunidadChange('cif', e.target.value)} onBlur={() => handleComunidadBlur('cif')} placeholder='A12345678'/>
                                    {touched.com_cif && errors.com_cif && <div className='invalid-feedback'>{errors.com_cif}</div>}
                                </div>
                            </div>

                            <h5 className="fw-bold mt-4">Ubicación</h5>

                            <div className="row">
                                <div className="mb-3 col-3">
                                    <label htmlFor="pais" className='form-label'>País</label>
                                    <input type="text" className={inputClass('com_pais')} id='pais' value={comunidad.pais} onChange={(e) => handleComunidadChange('pais', e.target.value)} onBlur={() => handleComunidadBlur('pais')} placeholder='España'/>
                                    {touched.com_pais && errors.com_pais && <div className='invalid-feedback'>{errors.com_pais}</div>}
                                </div>
                                <div className="mb-3 col-3">
                                    <label htmlFor="provincia" className='form-label'>Provincia</label>
                                    <input type="text" className={inputClass('com_provincia')} id='provincia' value={comunidad.provincia} onChange={(e) => handleComunidadChange('provincia', e.target.value)} onBlur={() => handleComunidadBlur('provincia')} placeholder='Madrid'/>
                                    {touched.com_provincia && errors.com_provincia && <div className='invalid-feedback'>{errors.com_provincia}</div>}
                                </div>
                                <div className="mb-3 col-5">
                                    <label htmlFor="municipio" className='form-label'>Municipio</label>
                                    <input type="text" className={inputClass('com_municipio')} id='municipio' value={comunidad.municipio} onChange={(e) => handleComunidadChange('municipio', e.target.value)} onBlur={() => handleComunidadBlur('municipio')} placeholder='Madrid'/>
                                    {touched.com_municipio && errors.com_municipio && <div className='invalid-feedback'>{errors.com_municipio}</div>}
                                </div>
                            </div>

                            <div className="row">
                                <div className="mb-3 col-6">
                                    <label htmlFor="tipo-via" className='form-label'>Tipo de vía</label>
                                    <input type="text" className={inputClass('com_tipoVia')} id='tipo-via' value={comunidad.tipoVia} onChange={(e) => handleComunidadChange('tipoVia', e.target.value)} onBlur={() => handleComunidadBlur('tipoVia')} placeholder='Calle'/>
                                    {touched.com_tipoVia && errors.com_tipoVia && <div className='invalid-feedback'>{errors.com_tipoVia}</div>}
                                </div>
                                <div className="mb-3 col-5">
                                    <label htmlFor="nombre-via" className='form-label'>Nombre de la vía</label>
                                    <input type="text" className={inputClass('com_nombreVia')} id='nombre-via' value={comunidad.nombreVia} onChange={(e) => handleComunidadChange('nombreVia', e.target.value)} onBlur={() => handleComunidadBlur('nombreVia')} placeholder='Cervantes'/>
                                    {touched.com_nombreVia && errors.com_nombreVia && <div className='invalid-feedback'>{errors.com_nombreVia}</div>}
                                </div>
                            </div>

                            <div className="row">
                                <div className="mb-3 col-3">
                                    <label htmlFor="cp" className='form-label'>Código Postal</label>
                                    <input type="text" className={inputClass('com_cp')} id='cp' value={comunidad.cp} onChange={(e) => handleComunidadChange('cp', e.target.value)} onBlur={() => handleComunidadBlur('cp')} placeholder='28000'/>
                                    {touched.com_cp && errors.com_cp && <div className='invalid-feedback'>{errors.com_cp}</div>}
                                </div>
                                <div className="mb-3 col-3">
                                    <label htmlFor="numero" className='form-label'>Número</label>
                                    <input type="text" className={inputClass('com_numero')} id='numero' value={comunidad.numero} onChange={(e) => handleComunidadChange('numero', e.target.value)} onBlur={() => handleComunidadBlur('numero')} placeholder='1'/>
                                    {touched.com_numero && errors.com_numero && <div className='invalid-feedback'>{errors.com_numero}</div>}
                                </div>
                            </div>

                        </div>

                        <button className='btn btn-secondary btn-validate d-block mx-auto mt-5 mb-5' onClick={handleValidarComunidad}>Validar</button>
                        
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
                                    <input type="text" className={inputClass('dom_pais')} value={domicilio.pais} onChange={(e) => handleDomicilioChange('pais', e.target.value)} onBlur={() => handleDomicilioBlur('pais')} id="pais" placeholder='España'/>
                                    {touched.dom_pais && errors.dom_pais && <div className='invalid-feedback'>{errors.dom_pais}</div>}
                                </div>
                                <div className="mb-3 col-3">
                                    <label htmlFor="provincia" className="form-label">Provincia</label>
                                    <input type="text" className={inputClass('dom_provincia')} value={domicilio.provincia} onChange={(e) => handleDomicilioChange('provincia', e.target.value)} onBlur={() => handleDomicilioBlur('provincia')} id="provincia" placeholder='Madrid'/>
                                    {touched.dom_provincia && errors.dom_provincia && <div className='invalid-feedback'>{errors.dom_provincia}</div>}
                                </div>
                                <div className="mb-3 col-6">
                                    <label htmlFor="municipio" className="form-label">Municipio</label>
                                    <input type="text" className={inputClass('dom_municipio')} value={domicilio.municipio} onChange={(e) => handleDomicilioChange('municipio', e.target.value)} onBlur={() => handleDomicilioBlur('municipio')} id="municipio" placeholder='Madrid'/>
                                    {touched.dom_municipio && errors.dom_municipio && <div className='invalid-feedback'>{errors.dom_municipio}</div>}
                                </div>
                            </div>

                            <div className="row">
                                <div className="mb-3 col-6">
                                    <label htmlFor="tipo-via" className="form-label">Tipo de vía</label>
                                    <input type="text" className={inputClass('dom_tipoVia')} value={domicilio.tipoVia} onChange={(e) => handleDomicilioChange('tipoVia', e.target.value)} onBlur={() => handleDomicilioBlur('tipoVia')} id="tipoVia" placeholder='Calle'/>
                                    {touched.dom_tipoVia && errors.dom_tipoVia && <div className='invalid-feedback'>{errors.dom_tipoVia}</div>}
                                </div>
                                <div className="mb-3 col-6">
                                    <label htmlFor="nombre-via" className="form-label">Nombre de la vía</label>
                                    <input type="text" className={inputClass('dom_nombreVia')} value={domicilio.nombreVia} onChange={(e) => handleDomicilioChange('nombreVia', e.target.value)} onBlur={() => handleDomicilioBlur('nombreVia')} id="nombreVia" placeholder='Cervantes'/>
                                    {touched.dom_nombreVia && errors.dom_nombreVia && <div className='invalid-feedback'>{errors.dom_nombreVia}</div>}
                                </div>
                            </div>

                            <div className="row">
                                <div className="mb-3 col-2">
                                    <label htmlFor="cp" className="form-label">C.P.</label>
                                    <input type="text" className={inputClass('dom_cp')} value={domicilio.cp} onChange={(e) => handleDomicilioChange('cp', e.target.value)} onBlur={() => handleDomicilioBlur('cp')} id="cp" placeholder='28000'/>
                                    {touched.dom_cp && errors.dom_cp && <div className='invalid-feedback'>{errors.dom_cp}</div>}
                                </div>
                                <div className="mb-3 col-2">
                                    <label htmlFor="numero" className="form-label">Nº</label>
                                    <input type="text" className={inputClass('dom_numero')} value={domicilio.numero} onChange={(e) => handleDomicilioChange('numero', e.target.value)} onBlur={() => handleDomicilioBlur('numero')} id="numero" placeholder='1'/>
                                    {touched.dom_numero && errors.dom_numero && <div className='invalid-feedback'>{errors.dom_numero}</div>}
                                </div>
                                <div className="mb-3 col-2">
                                    <label htmlFor="bloque" className="form-label">Bloque</label>
                                    <input type="text" className="form-control" value={domicilio.bloque} onChange={(e) => handleDomicilioChange('bloque', e.target.value)}id='bloque'/>
                                </div>
                                <div className="mb-3 col-3">
                                    <label htmlFor="planta" className="form-label">Planta</label>
                                    <input type="text" className="form-control" value={domicilio.planta} onChange={(e) => handleDomicilioChange('planta', e.target.value)}id='planta'/>
                                </div>
                                <div className="mb-3 col-3">
                                    <label htmlFor="puerta" className="form-label">Puerta</label>
                                    <input type="text" className="form-control" value={domicilio.puerta} onChange={(e) => handleDomicilioChange('puerta', e.target.value)}id='puerta'/>
                                </div>
                            </div>
                        </div>
                        <button className='btn btn-secondary d-block mx-auto mt-5 mb-5' onClick={handleConfirmarDomicilio}>Confirmar</button>
                    </div>

                    
                )}

            </main>
        </div>
    );


};


export default NewCommunityPage;

