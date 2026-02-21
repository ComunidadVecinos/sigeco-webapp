import React, {useState} from 'react';
import Header from '../../components/common/Header/Header';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { joinCommunity, createCommunity } from '../../services/communityServices';
import { useNavigate } from 'react-router-dom';

const NewCommunityPage: React.FC = () => {
    const navigate = useNavigate();
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

    const handleConfirmarDomicilio = async () => {
        if(validarDomicilio()) {
            try{
                if(opcion === 'unirse'){
                    await joinCommunity(codigo, {
                        country: domicilio.pais,
                        province: domicilio.provincia,
                        municipality: domicilio.municipio,
                        streetType: domicilio.tipoVia,
                        streetName: domicilio.nombreVia,
                        postalCode: domicilio.cp,
                        number: domicilio.numero,
                        block: domicilio.bloque || undefined,
                        floor: domicilio.planta|| undefined,
                        door: domicilio.puerta || undefined
                    });
                }
                else{
                    await createCommunity({
                        name: comunidad.nombre,
                        cif: comunidad.cif,
                        country: domicilio.pais,
                        province: domicilio.provincia,
                        municipality: domicilio.municipio,
                        streetType: domicilio.tipoVia,
                        streetName: domicilio.nombreVia,
                        postalCode: domicilio.cp,
                        number: domicilio.numero
                    });
                }
                alert('¡Comunidad registrada correctamente!');
                navigate('/auth/me');
            }
            catch (error: any){
                alert(error.response?.data?.message || 'Error al registrar');
            }
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
        if(!touched[key]) return '';
        return errors[key] ? 'border-red-500 focus-visible:ring-red-500' : 'border-green-500 focus-visible:ring-green-500';
    };

    return (
        <div>
            <Header
                navLinks={[
                    {label: "Ayuda", path: "/help"}
                ]}
             />

            <main className="max-w-5xl mx-auto px-4">
                <h2 className='text-3xl font-bold mt-50 text-gray-900'>Nueva Comunidad</h2>
                <div className="border border-gray-200 rounded-2xl bg-white shadow-sm mb-12 mt-5">
                    <div className="p-6">
                        <h3 className='font-bold ml-4 mt-4'>¿Cómo vas a conectar?</h3>
                        <p className='text-sm text-gray-500 ml-4'>Selecciona una de las dos opciones.</p>

                        <div className='flex flex-wrap gap-6 ml-4 mt-3 mb-5'>
                            <div className={`relative border-2 rounded-2xl p-6 cursor-pointer transition-all w-full md:w-[45%] ${opcion === 'unete' ? 'border-[#104084] bg-blue-50/30' : 'border-gray-200 hover:border-[#104084]/50 hover:shadow-md'}`} 
                            onClick={() =>{ setOpcion('unete'); setErrors({}); setTouched({}); }}>
                                <h5 className="font-bold text-gray-900 text-lg">Únete a una comunidad existente</h5>
                                <p className="text-[15px] text-gray-500 leading-relaxed">Introduce el código de invitación proporcionado por el presidente de la comunidad para formar parte d ella de inmediato.</p>
                                <input type="radio" className="w-5 h-5 accent-[#104084] absolute top-5 right-5 cursor-pointer" checked={opcion === 'unete'} readOnly/>
                            </div>

                            <div className={`relative border-2 rounded-2xl p-6 cursor-pointer transition-all w-full md:w-[45%] ${opcion === 'crear' ? 'border-[#104084] bg-blue-50/30' : 'border-gray-200 hover:border-[#104084]/50 hover:shadow-md'}`} onClick={() => { setOpcion('crear'); setErrors({}); setTouched({});}}>
                                <h5 className="font-bold text-gray-900 text-lg">Crea una nueva comunidad</h5>
                                <p className="text-[15px] text-gray-500 leading-relaxed">Inicia una comunidad desde cero. Configura sus detalles y conviértete en su presidente para invitar a otros miembros.</p>
                                <input type="radio" className="w-5 h-5 accent-[#104084] absolute top-5 right-5 cursor-pointer" checked={opcion === 'crear'} readOnly/>
                            </div>
                        </div>
                    </div>
                </div>

                {opcion === 'unete' && (
                    <div className="border border-gray-200 rounded-2xl bg-white shadow-sm mb-12">
                        <div className="p-6">
                            <h3 className='font-bold ml-4 mt-4'>Código de Registro</h3>
                            <p className='text-sm text-gray-500 ml-4'>Por favor, contacta con tu presidente y/o administrador y obtén tu código de registro.</p>

                            <div className='mx-4 mt-3 space-y-2'>
                                <Label className='font-semibold'>Introduce tu código de registro</Label>
                                <Input 
                                    className={inputClass('codigo')} 
                                    value={codigo} 
                                    onChange={(e) => {setCodigo(e.target.value); if (touched.codigo) {const err = validateField('codigo', e.target.value); setErrors(prev => ({...prev, codigo: err || ''})); }}}
                                    onBlur={() => {setTouched(prev => ({...prev, codigo: true})); const err = validateField('codigo', codigo); setErrors(prev => ({...prev, codigo: err || ''}));}}
                                />
                                {touched.codigo && errors.codigo && <p className='text-sm text-red-500'>{errors.codigo}</p>}
                            </div>
                            <div className="flex justify-center mt-8 mb-5">
                                <Button variant="secondary" onClick={handleValidarCodigo}>Validar</Button>
                            </div>
                        </div>
                    </div>
                )}

                {opcion === 'crear' && (
                    <div className="border border-gray-200 rounded-2xl bg-white shadow-sm mb-12">
                        <div className="p-6">
                        <h3 className='font-bold ml-4 mt-4'>Datos de la comunidad</h3>
                        <p className='text-sm text-gray-500 ml-4'>Por favor, introduzca los datos de su comunidad de vecinos.</p>

                        <div className="mx-4 mt-4">
                            <div className="grid grid-cols-12 gap-4">
                                <div className="col-span-12 md:col-span-7 space-y-2">
                                    <Label>Nombre de la comunidad</Label>
                                    <Input 
                                        className={inputClass('com_nombre')} 
                                        value={comunidad.nombre} 
                                        onChange={(e) => handleComunidadChange('nombre', e.target.value)} onBlur={() => handleComunidadBlur('nombre')}
                                    /> 
                                    {touched.com_nombre && errors.com_nombre && <p className='text-sm text-red-500'>{errors.com_nombre}</p>}
                                </div>
                                <div className="col-span-12 md:col-span-4 space-y-2">
                                    <Label>C.I.F.</Label>
                                    <Input 
                                        className={inputClass('com_cif')} 
                                        value={comunidad.cif} 
                                        onChange={(e) => handleComunidadChange('cif', e.target.value)} 
                                        onBlur={() => handleComunidadBlur('cif')} 
                                        placeholder='A12345678'
                                    />
                                    {touched.com_cif && errors.com_cif && <p className='text-sm text-red-500'>{errors.com_cif}</p>}
                                </div>
                            </div>

                            <h5 className="font-bold mt-6">Ubicación</h5>

                            <div className="grid grid-cols-12 gap-4 mt-2">
                                <div className="col-span-12 md:col-span-3 space-y-2">
                                    <Label>País</Label>
                                    <Input 
                                        className={inputClass('com_pais')} 
                                        value={comunidad.pais} 
                                        onChange={(e) => handleComunidadChange('pais', e.target.value)} onBlur={() => handleComunidadBlur('pais')} 
                                        placeholder='España'
                                    />
                                    {touched.com_pais && errors.com_pais && <p className='text-sm text-red-500'>{errors.com_pais}</p>}
                                </div>
                                <div className="col-span-12 md:col-span-3 space-y-2">
                                    <Label>Provincia</Label>
                                    <Input 
                                        className={inputClass('com_provincia')} 
                                        value={comunidad.provincia} 
                                        onChange={(e) => handleComunidadChange('provincia', e.target.value)} 
                                        onBlur={() => handleComunidadBlur('provincia')} placeholder='Madrid'
                                    />
                                    {touched.com_provincia && errors.com_provincia && <p className='text-sm text-red-500'>{errors.com_provincia}</p>}
                                </div>
                                <div className="col-span-12 md:col-span-5 space-y-2">
                                    <Label>Municipio</Label>
                                    <Input 
                                        className={inputClass('com_municipio')} 
                                        value={comunidad.municipio} 
                                        onChange={(e) => handleComunidadChange('municipio', e.target.value)} 
                                        onBlur={() => handleComunidadBlur('municipio')} placeholder='Madrid'
                                    />
                                    {touched.com_municipio && errors.com_municipio && <p className='text-sm text-red-500'>{errors.com_municipio}</p>}
                                </div>
                            </div>

                            <div className="grid grid-cols-12 gap-4 mt-4">
                                <div className="col-span-12 md:col-span-6 space-y-2">
                                    <Label>Tipo de vía</Label>
                                    <Input 
                                        className={inputClass('com_tipoVia')} 
                                        value={comunidad.tipoVia} 
                                        onChange={(e) => handleComunidadChange('tipoVia', e.target.value)} onBlur={() => handleComunidadBlur('tipoVia')} 
                                        placeholder='Calle'
                                    />
                                    {touched.com_tipoVia && errors.com_tipoVia && <p className='text-sm text-red-500'>{errors.com_tipoVia}</p>}
                                </div>
                                <div className="col-span-12 md:col-span-5 space-y-2">
                                    <Label>Nombre de la vía</Label>
                                    <Input 
                                        className={inputClass('com_nombreVia')} 
                                        value={comunidad.nombreVia} 
                                        onChange={(e) => handleComunidadChange('nombreVia', e.target.value)} 
                                        onBlur={() => handleComunidadBlur('nombreVia')} placeholder='Cervantes'
                                    />
                                    {touched.com_nombreVia && errors.com_nombreVia && <p className='text-sm text-red-500'>{errors.com_nombreVia}</p>}
                                </div>
                            </div>

                            <div className="grid grid-cols-12 gap-4 mt-4">
                                <div className="col-span-6 md:col-span-3 space-y-2">
                                    <Label>Código Postal</Label>
                                    <Input 
                                        className={inputClass('com_cp')}
                                        value={comunidad.cp} 
                                        onChange={(e) => handleComunidadChange('cp', e.target.value)} 
                                        onBlur={() => handleComunidadBlur('cp')} 
                                        placeholder='28000'
                                    />
                                    {touched.com_cp && errors.com_cp && <p className='text-sm text-red-500'>{errors.com_cp}</p>}
                                </div>
                                <div className="col-span-6 md:col-span-3 space-y-2">
                                    <Label>Número</Label>
                                    <Input 
                                        className={inputClass('com_numero')} 
                                        value={comunidad.numero} 
                                        onChange={(e) => handleComunidadChange('numero', e.target.value)} onBlur={() => handleComunidadBlur('numero')} 
                                        placeholder='1'
                                    />
                                    {touched.com_numero && errors.com_numero && <p className='text-sm text-red-500'>{errors.com_numero}</p>}
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-center mt-8 mb-5">
                            <Button variant="secondary" onClick={handleValidarComunidad}>Validar</Button>
                        </div>
                        </div>
                    </div>
                )}

                {opcion === 'registro-vivienda' && (
                    <div className="border border-gray-200 rounded-2xl bg-white shadow-sm mb-12">
                        <div className="p-6">
                        <h3 className="font-bold ml-4 mt-4">Datos de tu domicilio</h3>
                        <p className='text-sm text-gray-500 ml-4'>Introduce los datos de tu vivienda perteneciente a la comunidad anterior.</p>

                        <div className="mx-4 mt-4">
                            <div className="grid grid-cols-12 gap-4">
                                 <div className="col-span-12 md:col-span-3 space-y-2">
                                    <Label>País</Label>
                                    <Input 
                                        className={inputClass('dom_pais')} 
                                        value={domicilio.pais} 
                                        onChange={(e) => handleDomicilioChange('pais', e.target.value)} 
                                        onBlur={() => handleDomicilioBlur('pais')}  
                                        placeholder='España'
                                    />
                                    {touched.dom_pais && errors.dom_pais && <p className='text-sm text-red-500'>{errors.dom_pais}</p>}
                                </div>
                                <div className="col-span-12 md:col-span-3 space-y-2">
                                    <Label>Provincia</Label>
                                    <Input 
                                        className={inputClass('dom_provincia')} 
                                        value={domicilio.provincia} 
                                        onChange={(e) => handleDomicilioChange('provincia', e.target.value)} 
                                        onBlur={() => handleDomicilioBlur('provincia')} placeholder='Madrid'
                                    />
                                    {touched.dom_provincia && errors.dom_provincia && <p className='text-sm text-red-500'>{errors.dom_provincia}</p>}
                                </div>
                                <div className="col-span-12 md:col-span-6 space-y-2">
                                    <Label>Municipio</Label>
                                    <Input 
                                        className={inputClass('dom_municipio')} 
                                        value={domicilio.municipio} 
                                        onChange={(e) => handleDomicilioChange('municipio', e.target.value)} 
                                        onBlur={() => handleDomicilioBlur('municipio')} placeholder='Madrid'
                                    />
                                    {touched.dom_municipio && errors.dom_municipio && <p className='text-sm text-red-500'>{errors.dom_municipio}</p>}
                                </div>
                            </div>

                            <div className="grid grid-cols-12 gap-4 mt-4">
                                <div className="col-span-12 md:col-span-6 space-y-2">
                                    <Label>Tipo de vía</Label>
                                    <Input 
                                        className={inputClass('dom_tipoVia')} 
                                        value={domicilio.tipoVia} 
                                        onChange={(e) => handleDomicilioChange('tipoVia', e.target.value)} onBlur={() => handleDomicilioBlur('tipoVia')} 
                                        placeholder='Calle'
                                    />
                                    {touched.dom_tipoVia && errors.dom_tipoVia && <p className='text-sm text-red-500'>{errors.dom_tipoVia}</p>}
                                </div>
                                <div className="col-span-12 md:col-span-6 space-y-2">
                                    <Label>Nombre de la vía</Label>
                                    <Input 
                                        className={inputClass('dom_nombreVia')} 
                                        value={domicilio.nombreVia} 
                                        onChange={(e) => handleDomicilioChange('nombreVia', e.target.value)} 
                                        onBlur={() => handleDomicilioBlur('nombreVia')} placeholder='Cervantes'
                                    />
                                    {touched.dom_nombreVia && errors.dom_nombreVia && <p className='text-sm text-red-500'>{errors.dom_nombreVia}</p>}
                                </div>
                            </div>

                            <div className="grid grid-cols-12 gap-4 mt-4">
                                <div className="col-span-4 md:col-span-2 space-y-2">
                                    <Label>C.P.</Label>
                                    <Input 
                                        className={inputClass('dom_cp')} 
                                        value={domicilio.cp} 
                                        onChange={(e) => handleDomicilioChange('cp', e.target.value)} onBlur={() => handleDomicilioBlur('cp')}
                                        placeholder='28000'
                                    />
                                    {touched.dom_cp && errors.dom_cp && <p className='text-sm text-red-500'>{errors.dom_cp}</p>}
                                </div>
                                <div className="col-span-4 md:col-span-2 space-y-2">
                                    <Label>Nº</Label>
                                    <Input 
                                        className={inputClass('dom_numero')} 
                                        value={domicilio.numero} 
                                        onChange={(e) => handleDomicilioChange('numero', e.target.value)} onBlur={() => handleDomicilioBlur('numero')}
                                        placeholder='1'
                                    />
                                    {touched.dom_numero && errors.dom_numero && <p className='text-sm text-red-500'>{errors.dom_numero}</p>}
                                </div>
                                <div className="col-span-4 md:col-span-2 space-y-2">
                                    <Label>Bloque</Label>
                                    <Input 
        
                                        value={domicilio.bloque} 
                                        onChange={(e) => handleDomicilioChange('bloque', e.target.value)}
                                    />
                                </div>
                                <div className="col-span-6 md:col-span-3 space-y-2">
                                    <Label>Planta</Label>
                                    <Input 
                                        
                                        value={domicilio.planta} 
                                        onChange={(e) => handleDomicilioChange('planta', e.target.value)}
                                    />
                                </div>
                                <div className="col-span-6 md:col-span-3 space-y-2">
                                    <Label>Puerta</Label>
                                    <Input 
                                         
                                        value={domicilio.puerta} 
                                        onChange={(e) => handleDomicilioChange('puerta', e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-center mt-8 mb-5">
                            <Button variant="secondary" onClick={handleConfirmarDomicilio}>Confirmar</Button>
                        </div>
                    </div>
                    </div>
                    
                )}

            </main>
        </div>
    );


};


export default NewCommunityPage;

