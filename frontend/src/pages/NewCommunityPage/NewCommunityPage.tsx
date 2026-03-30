import React, {useMemo, useState} from 'react';
import Header from '../../components/common/Header/Header';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { requestJoinCommunity, createCommunity } from '../../services/communityServices';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/authContext';
import { getApiErrorMessage, getApiFieldErrors, hasFieldErrors } from '@/lib/formErrors';
import { isValidCommunityOwnersCif, isValidSpanishPostalCode, isValidStreetNumberKm } from '@/lib/communityValidation';
import { ArrowLeft } from 'lucide-react';

type Opcion = 'unete' | 'crear' | '';

const ACCESS_CODE_REGEX = /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{8}$/;

const NewCommunityPage: React.FC = () => {
    const navigate = useNavigate();
    const {refreshUser} = useAuth();

    const [opcion, setOpcion] = useState<Opcion>('');
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [touched, setTouched] = useState<Record<string, boolean>>({});
    const [globalError, setGlobalError] = useState('');
    const [codigoValidated, setCodigoValidated] = useState(false);
    const [communityValidated, setCommunityValidated] = useState(false);
    const [submitting, setSubmitting] = useState(false);

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
        alias: '',
        comentario: '',
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

    const showPropertyCard = useMemo(() => {
        return (opcion === 'unete' && codigoValidated) || (opcion === 'crear' && communityValidated);
    }, [codigoValidated, communityValidated, opcion]);

    const resetFeedback = () => {
        setErrors({});
        setTouched({});
        setGlobalError('');
    };

    const setTouchedFields = (keys: string[]) => {
        setTouched((prev) => keys.reduce((acc, key) => ({ ...acc, [key]: true }), prev));
    };

    const mergeErrors = (keys: string[], nextErrors: Record<string, string>) => {
        setErrors((prev) => {
            const remainingEntries = Object.entries(prev).filter(([key]) => !keys.includes(key));
            return { ...Object.fromEntries(remainingEntries), ...nextErrors };
        });
    };

    const validateField = (name: string, value: string): string | undefined => {
        const trimmedValue = value.trim();

        switch(name){
            case 'codigo':
                if (!trimmedValue) return 'El codigo de registro es requerido';
                if (!ACCESS_CODE_REGEX.test(trimmedValue.toUpperCase())) return 'El codigo debe tener 8 caracteres validos';
                return undefined;
            case 'alias':
                if (!trimmedValue) return 'El alias es requerido';
                return undefined;
            case 'nombre':
                if (!trimmedValue) return 'El nombre de la comunidad es requerido';
                return undefined;
            case 'cif':
                if (!trimmedValue) return 'El CIF es requerido';
                if (!isValidCommunityOwnersCif(trimmedValue)) return 'Introduce un CIF con formato H seguido de 8 cifras';
                return undefined;
            case 'pais':
                if (!trimmedValue) return 'El pais es requerido';
                return undefined;
            case 'provincia':
                if (!trimmedValue) return 'La provincia es requerida';
                return undefined;
            case 'municipio':
                if (!trimmedValue) return 'El municipio es requerido';
                return undefined;
            case 'tipoVia':
                if (!trimmedValue) return 'El tipo de via es requerido';
                return undefined;
            case 'nombreVia':
                if (!trimmedValue) return 'El nombre de la via es requerido';
                return undefined;
            case 'cp':
                if (!trimmedValue) return 'El codigo postal es requerido';
                if (!isValidSpanishPostalCode(trimmedValue)) return 'El codigo postal debe ser valido y tener 5 digitos';
                return undefined;
            case 'numero':
                if (!trimmedValue) return 'El numero es requerido';
                if (!isValidStreetNumberKm(trimmedValue)) return 'Introduce un numero o Km valido';
                return undefined;
            default:
                return undefined;
        }
    };

    const validateJoinCode = () => {
        const codeError = validateField('codigo', codigo);
        setTouchedFields(['codigo']);
        mergeErrors(['codigo'], codeError ? { codigo: codeError } : {});
        setCodigoValidated(!codeError);
        if (!codeError) setGlobalError('');
        return !codeError;
    };

    const validateCommunitySection = () => {
        const fields = ['nombre', 'cif', 'pais', 'provincia', 'municipio', 'tipoVia', 'nombreVia', 'cp', 'numero'];
        const keys = fields.map((field) => `com_${field}`);
        const nextErrors: Record<string, string> = {};

        fields.forEach((field) => {
            const error = validateField(field, (comunidad as Record<string, string>)[field]);
            if (error) nextErrors[`com_${field}`] = error;
        });

        setTouchedFields(keys);
        mergeErrors(keys, nextErrors);
        setCommunityValidated(Object.keys(nextErrors).length === 0);
        if (Object.keys(nextErrors).length === 0) setGlobalError('');
        return Object.keys(nextErrors).length === 0;
    };

    const validatePropertySection = () => {
        const fields = ['pais', 'provincia', 'municipio', 'tipoVia', 'nombreVia', 'cp', 'numero', 'alias'];
        const keys = fields.map((field) => `dom_${field}`);
        const nextErrors: Record<string, string> = {};

        fields.forEach((field) => {
            const validationField = field === 'alias' ? 'alias' : field;
            const value = field === 'alias' ? domicilio.alias : (domicilio as Record<string, string>)[field];
            const error = validateField(validationField, value);
            if (error) nextErrors[`dom_${field}`] = error;
        });

        setTouchedFields(keys);
        mergeErrors(keys, nextErrors);
        return Object.keys(nextErrors).length === 0;
    };

    const handleSelectOption = (nextOption: Opcion) => {
        setOpcion(nextOption);
        setCodigoValidated(false);
        setCommunityValidated(false);
        resetFeedback();
    };

    const handleCodigoChange = (value: string) => {
        setCodigo(value);

        if (touched.codigo) {
            const error = validateField('codigo', value);
            mergeErrors(['codigo'], error ? { codigo: error } : {});
        }
    };

    const handleComunidadChange = (campo: string, valor: string) => {
        setComunidad({ ...comunidad, [campo]: valor});
        if(touched[`com_${campo}`]){
            const err = validateField(campo, valor);
            mergeErrors([`com_${campo}`], err ? { [`com_${campo}`]: err } : {});
        }
    };

    const handleComunidadBlur = (campo: string) => {
        setTouchedFields([`com_${campo}`]);
        const err = validateField(campo, (comunidad as Record<string, string>)[campo]);
        mergeErrors([`com_${campo}`], err ? { [`com_${campo}`]: err } : {});
    };

    const handleDomicilioChange = (campo: string, valor: string) => {
        setDomicilio({ ...domicilio, [campo]: valor});
        if(touched[`dom_${campo}`]){
            const validationField = campo === 'alias' ? 'alias' : campo;
            const err = validateField(validationField, valor);
            mergeErrors([`dom_${campo}`], err ? { [`dom_${campo}`]: err } : {});
        }
    };

    const handleDomicilioBlur = (campo: string) => {
        setTouchedFields([`dom_${campo}`]);
        const validationField = campo === 'alias' ? 'alias' : campo;
        const value = (domicilio as Record<string, string>)[campo];
        const err = validateField(validationField, value);
        mergeErrors([`dom_${campo}`], err ? { [`dom_${campo}`]: err } : {});
    };

    const handleSubmit = async () => {
        resetFeedback();

        const codeOk = opcion !== 'unete' || validateJoinCode();
        const communityOk = opcion !== 'crear' || validateCommunitySection();
        const propertyOk = validatePropertySection();

        if (!codeOk || !communityOk || !propertyOk) {
            return;
        }

        setSubmitting(true);

        try{
            if(opcion === 'unete'){
                await requestJoinCommunity(codigo.trim().toUpperCase(), {
                    alias: domicilio.alias,
                    comment: domicilio.comentario || undefined,
                    domicile: {
                        country: domicilio.pais,
                        province: domicilio.provincia,
                        municipality: domicilio.municipio,
                        streetType: domicilio.tipoVia,
                        streetName: domicilio.nombreVia,
                        postalCode: domicilio.cp,
                        number: domicilio.numero,
                        block: domicilio.bloque || undefined,
                        floor: domicilio.planta || undefined,
                        door: domicilio.puerta || undefined
                    }
                });
                navigate('/auth/me');
                return;
            }

            await createCommunity({
                name: comunidad.nombre,
                cif: comunidad.cif,
                alias: domicilio.alias,
                country: comunidad.pais,
                province: comunidad.provincia,
                municipality: comunidad.municipio,
                streetType: comunidad.tipoVia,
                streetName: comunidad.nombreVia,
                postalCode: comunidad.cp,
                number: comunidad.numero,
                domicile: {
                    country: domicilio.pais,
                    province: domicilio.provincia,
                    municipality: domicilio.municipio,
                    streetType: domicilio.tipoVia,
                    streetName: domicilio.nombreVia,
                    postalCode: domicilio.cp,
                    number: domicilio.numero,
                    block: domicilio.bloque || undefined,
                    floor: domicilio.planta || undefined,
                    door: domicilio.puerta || undefined
                }
            });
            await refreshUser();
            navigate('/admin');
        }
        catch (error: any){
            const fieldMap = opcion === 'crear'
                ? {
                    'community.name': 'com_nombre',
                    'community.cif': 'com_cif',
                    'community.country': 'com_pais',
                    'community.province': 'com_provincia',
                    'community.municipality': 'com_municipio',
                    'community.streetType': 'com_tipoVia',
                    'community.streetName': 'com_nombreVia',
                    'community.postalCode': 'com_cp',
                    'community.streetNumberKm': 'com_numero',
                    'creatorProperty.country': 'dom_pais',
                    'creatorProperty.province': 'dom_provincia',
                    'creatorProperty.municipality': 'dom_municipio',
                    'creatorProperty.streetType': 'dom_tipoVia',
                    'creatorProperty.streetName': 'dom_nombreVia',
                    'creatorProperty.postalCode': 'dom_cp',
                    'creatorProperty.streetNumberKm': 'dom_numero',
                    'creatorProperty.block': 'dom_bloque',
                    'creatorProperty.floor': 'dom_planta',
                    'creatorProperty.door': 'dom_puerta',
                    alias: 'dom_alias'
                }
                : {
                    accessCode: 'codigo',
                    proposedAlias: 'dom_alias',
                    country: 'dom_pais',
                    province: 'dom_provincia',
                    municipality: 'dom_municipio',
                    streetType: 'dom_tipoVia',
                    streetName: 'dom_nombreVia',
                    postalCode: 'dom_cp',
                    streetNumberKm: 'dom_numero',
                    block: 'dom_bloque',
                    floor: 'dom_planta',
                    door: 'dom_puerta',
                    requestComment: 'dom_comentario'
                };

            const fieldErrors = getApiFieldErrors(error, fieldMap);

            if (hasFieldErrors(fieldErrors)) {
                mergeErrors(Object.keys(fieldErrors), fieldErrors);
                setTouchedFields(Object.keys(fieldErrors));
            } else {
                setGlobalError(getApiErrorMessage(error, 'No se ha podido completar la operacion. Revisa los datos e intentalo de nuevo.'));
            }
        } finally {
            setSubmitting(false);
        }
    };

    const inputClass = (key: string): string => {
        if(!touched[key]) return '';
        return errors[key] ? 'border-red-500 focus-visible:ring-red-500' : 'border-green-500 focus-visible:ring-green-500';
    };

    const renderInlineError = (key: string) => {
        if(!errors[key]) return null;
        return <p className='text-sm text-red-500'>{errors[key]}</p>;
    };

    return (
        <div>
            <Header navLinks={[{label: "Ayuda", path: "/help"}]} />
            <main className="max-w-5xl mx-auto px-4">
                <div className="mt-35 flex flex-wrap items-center justify-between gap-3">
                    <h2 className='text-3xl font-bold text-gray-900'>Nueva Comunidad</h2>
                    <Button asChild variant="outline" size="sm">
                        <Link to="/auth/me">
                            <ArrowLeft className='h-4 w-4 mr-2' />
                            Volver al perfil
                        </Link>
                    </Button>
                </div>
                {globalError && (
                    <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {globalError}
                    </div>
                )}

                <div className="border border-gray-200 rounded-2xl bg-white shadow-sm mb-12 mt-5">
                    <div className="p-6">
                        <h3 className='font-bold ml-4 mt-4'>¿Cómo vas a conectar?</h3>
                        <p className='text-sm text-gray-500 ml-4'>Selecciona una de las dos opciones.</p>

                        <div className='flex flex-wrap gap-6 ml-4 mt-3 mb-5'>
                            <div
                                className={`relative border-2 rounded-2xl p-6 cursor-pointer transition-all w-full md:w-[45%] ${opcion === 'unete' ? 'border-[#104084] bg-blue-50/30' : 'border-gray-200 hover:border-[#104084]/50 hover:shadow-md'}`}
                                onClick={() => handleSelectOption('unete')}
                            >
                                <h5 className="font-bold text-gray-900 text-lg">Únete a una comunidad existente</h5>
                                <p className="text-[15px] text-gray-500 leading-relaxed">
                                    Introduce el código de invitación proporcionado por el presidente de la comunidad y valida el acceso antes de registrar tu vivienda.
                                </p>
                                <input type="radio" className="w-5 h-5 accent-[#104084] absolute top-5 right-5 cursor-pointer" checked={opcion === 'unete'} readOnly/>
                            </div>

                            <div
                                className={`relative border-2 rounded-2xl p-6 cursor-pointer transition-all w-full md:w-[45%] ${opcion === 'crear' ? 'border-[#104084] bg-blue-50/30' : 'border-gray-200 hover:border-[#104084]/50 hover:shadow-md'}`}
                                onClick={() => handleSelectOption('crear')}
                            >
                                <h5 className="font-bold text-gray-900 text-lg">Crea una nueva comunidad</h5>
                                <p className="text-[15px] text-gray-500 leading-relaxed">
                                    Inicia una comunidad desde cero. Primero valida sus datos y después registra la vivienda del futuro presidente.
                                </p>
                                <input type="radio" className="w-5 h-5 accent-[#104084] absolute top-5 right-5 cursor-pointer" checked={opcion === 'crear'} readOnly/>
                            </div>
                        </div>
                    </div>
                </div>

                {opcion === 'unete' && (
                    <div className="border border-gray-200 rounded-2xl bg-white shadow-sm mb-12">
                        <div className="p-6">
                            <h3 className='font-bold ml-4 mt-4'>Código de Registro</h3>
                            <p className='text-sm text-gray-500 ml-4'>Valida el código y, cuando sea correcto, completa debajo los datos de tu vivienda.</p>

                            <div className='mx-4 mt-3 space-y-2'>
                                <Label className='font-semibold' htmlFor="codigo">Introduce tu código de registro</Label>
                                <Input
                                    id="codigo"
                                    className={inputClass('codigo')}
                                    value={codigo}
                                    onChange={(e) => handleCodigoChange(e.target.value.toUpperCase())}
                                    onBlur={() => {
                                        setTouchedFields(['codigo']);
                                        const err = validateField('codigo', codigo);
                                        mergeErrors(['codigo'], err ? { codigo: err } : {});
                                    }}
                                    placeholder='SGECA234'
                                    maxLength={8}
                                />
                                {renderInlineError('codigo')}
                                {codigoValidated && !errors.codigo && <p className='text-sm text-green-600'>Código validado. Ya puedes completar el domicilio en la tarjeta siguiente.</p>}
                            </div>
                            <div className="flex justify-center gap-3 mt-8 mb-5">
                                <Button variant="secondary" onClick={validateJoinCode}>Validar</Button>
                                <Button asChild variant="outline">
                                    <Link to="/auth/me">Cancelar</Link>
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {opcion === 'crear' && (
                    <div className="border border-gray-200 rounded-2xl bg-white shadow-sm mb-12">
                        <div className="p-6">
                            <h3 className='font-bold ml-4 mt-4'>Datos de la comunidad</h3>
                            <p className='text-sm text-gray-500 ml-4'>Por favor, introduce los datos de tu comunidad de vecinos y valida el bloque antes de continuar.</p>

                            <div className="mx-4 mt-4">
                                <div className="grid grid-cols-12 gap-4">
                                    <div className="col-span-12 md:col-span-7 space-y-2">
                                        <Label htmlFor="com-nombre">Nombre de la comunidad</Label>
                                        <Input
                                            id="com-nombre"
                                            className={inputClass('com_nombre')}
                                            value={comunidad.nombre}
                                            onChange={(e) => handleComunidadChange('nombre', e.target.value)}
                                            onBlur={() => handleComunidadBlur('nombre')}
                                        />
                                        {renderInlineError('com_nombre')}
                                    </div>
                                    <div className="col-span-12 md:col-span-4 space-y-2">
                                        <Label htmlFor="com-cif">C.I.F.</Label>
                                        <Input
                                            id="com-cif"
                                            className={inputClass('com_cif')}
                                            value={comunidad.cif}
                                            onChange={(e) => handleComunidadChange('cif', e.target.value)}
                                            onBlur={() => handleComunidadBlur('cif')}
                                            placeholder='H-12345674'
                                        />
                                        {renderInlineError('com_cif')}
                                    </div>
                                </div>

                                <h5 className="font-bold mt-6">Ubicación</h5>

                                <div className="grid grid-cols-12 gap-4 mt-2">
                                    <div className="col-span-12 md:col-span-3 space-y-2">
                                        <Label htmlFor="com-pais">País</Label>
                                        <Input
                                            id="com-pais"
                                            className={inputClass('com_pais')}
                                            value={comunidad.pais}
                                            onChange={(e) => handleComunidadChange('pais', e.target.value)}
                                            onBlur={() => handleComunidadBlur('pais')}
                                            placeholder='España'
                                        />
                                        {renderInlineError('com_pais')}
                                    </div>
                                    <div className="col-span-12 md:col-span-3 space-y-2">
                                        <Label htmlFor="com-provincia">Provincia</Label>
                                        <Input
                                            id="com-provincia"
                                            className={inputClass('com_provincia')}
                                            value={comunidad.provincia}
                                            onChange={(e) => handleComunidadChange('provincia', e.target.value)}
                                            onBlur={() => handleComunidadBlur('provincia')}
                                            placeholder='Madrid'
                                        />
                                        {renderInlineError('com_provincia')}
                                    </div>
                                    <div className="col-span-12 md:col-span-5 space-y-2">
                                        <Label htmlFor="com-municipio">Municipio</Label>
                                        <Input
                                            id="com-municipio"
                                            className={inputClass('com_municipio')}
                                            value={comunidad.municipio}
                                            onChange={(e) => handleComunidadChange('municipio', e.target.value)}
                                            onBlur={() => handleComunidadBlur('municipio')}
                                            placeholder='Madrid'
                                        />
                                        {renderInlineError('com_municipio')}
                                    </div>
                                </div>

                                <div className="grid grid-cols-12 gap-4 mt-4">
                                    <div className="col-span-12 md:col-span-6 space-y-2">
                                        <Label htmlFor="com-tipovia">Tipo de vía</Label>
                                        <Input
                                            id="com-tipovia"
                                            className={inputClass('com_tipoVia')}
                                            value={comunidad.tipoVia}
                                            onChange={(e) => handleComunidadChange('tipoVia', e.target.value)}
                                            onBlur={() => handleComunidadBlur('tipoVia')}
                                            placeholder='Calle'
                                        />
                                        {renderInlineError('com_tipoVia')}
                                    </div>
                                    <div className="col-span-12 md:col-span-5 space-y-2">
                                        <Label htmlFor="com-nombreVia">Nombre de la vía</Label>
                                        <Input
                                            id="com-nombreVia"
                                            className={inputClass('com_nombreVia')}
                                            value={comunidad.nombreVia}
                                            onChange={(e) => handleComunidadChange('nombreVia', e.target.value)}
                                            onBlur={() => handleComunidadBlur('nombreVia')}
                                            placeholder='Cervantes'
                                        />
                                        {renderInlineError('com_nombreVia')}
                                    </div>
                                </div>

                                <div className="grid grid-cols-12 gap-4 mt-4">
                                    <div className="col-span-6 md:col-span-3 space-y-2">
                                        <Label htmlFor="com-cp">Código Postal</Label>
                                        <Input
                                            id="com-cp"
                                            className={inputClass('com_cp')}
                                            value={comunidad.cp}
                                            onChange={(e) => handleComunidadChange('cp', e.target.value)}
                                            onBlur={() => handleComunidadBlur('cp')}
                                            placeholder='28000'
                                        />
                                        {renderInlineError('com_cp')}
                                    </div>
                                    <div className="col-span-6 md:col-span-3 space-y-2">
                                        <Label htmlFor="com-numero">Número</Label>
                                        <Input
                                            id="com-numero"
                                            className={inputClass('com_numero')}
                                            value={comunidad.numero}
                                            onChange={(e) => handleComunidadChange('numero', e.target.value)}
                                            onBlur={() => handleComunidadBlur('numero')}
                                            placeholder='1'
                                        />
                                        {renderInlineError('com_numero')}
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-center gap-3 mt-8 mb-5">
                                <Button variant="secondary" onClick={validateCommunitySection}>Validar</Button>
                                <Button asChild variant="outline">
                                    <Link to="/auth/me">Cancelar</Link>
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {showPropertyCard && (
                    <div className="border border-gray-200 rounded-2xl bg-white shadow-sm mb-12">
                        <div className="p-6">
                            <h3 className="font-bold ml-4 mt-4">Datos de tu domicilio</h3>
                            <p className='text-sm text-gray-500 ml-4'>Introduce los datos de tu vivienda perteneciente a la comunidad anterior. Esta confirmación realiza el envío final.</p>

                            <div className="mx-4 mt-4">
                                <div className="grid grid-cols-12 gap-4">
                                    <div className="col-span-12 md:col-span-3 space-y-2">
                                        <Label htmlFor="dom-pais">País</Label>
                                        <Input
                                            id="dom-pais"
                                            className={inputClass('dom_pais')}
                                            value={domicilio.pais}
                                            onChange={(e) => handleDomicilioChange('pais', e.target.value)}
                                            onBlur={() => handleDomicilioBlur('pais')}
                                            placeholder='España'
                                        />
                                        {renderInlineError('dom_pais')}
                                    </div>
                                    <div className="col-span-12 md:col-span-3 space-y-2">
                                        <Label htmlFor="dom-provincia">Provincia</Label>
                                        <Input
                                            id="dom-provincia"
                                            className={inputClass('dom_provincia')}
                                            value={domicilio.provincia}
                                            onChange={(e) => handleDomicilioChange('provincia', e.target.value)}
                                            onBlur={() => handleDomicilioBlur('provincia')}
                                            placeholder='Madrid'
                                        />
                                        {renderInlineError('dom_provincia')}
                                    </div>
                                    <div className="col-span-12 md:col-span-6 space-y-2">
                                        <Label htmlFor="dom-municipio">Municipio</Label>
                                        <Input
                                            id="dom-municipio"
                                            className={inputClass('dom_municipio')}
                                            value={domicilio.municipio}
                                            onChange={(e) => handleDomicilioChange('municipio', e.target.value)}
                                            onBlur={() => handleDomicilioBlur('municipio')}
                                            placeholder='Madrid'
                                        />
                                        {renderInlineError('dom_municipio')}
                                    </div>
                                </div>

                                <div className="grid grid-cols-12 gap-4 mt-4">
                                    <div className="col-span-12 md:col-span-6 space-y-2">
                                        <Label htmlFor="dom-tipoVia">Tipo de vía</Label>
                                        <Input
                                            id="dom-tipoVia"
                                            className={inputClass('dom_tipoVia')}
                                            value={domicilio.tipoVia}
                                            onChange={(e) => handleDomicilioChange('tipoVia', e.target.value)}
                                            onBlur={() => handleDomicilioBlur('tipoVia')}
                                            placeholder='Calle'
                                        />
                                        {renderInlineError('dom_tipoVia')}
                                    </div>
                                    <div className="col-span-12 md:col-span-6 space-y-2">
                                        <Label htmlFor="dom-nombreVia">Nombre de la vía</Label>
                                        <Input
                                            id="dom-nombreVia"
                                            className={inputClass('dom_nombreVia')}
                                            value={domicilio.nombreVia}
                                            onChange={(e) => handleDomicilioChange('nombreVia', e.target.value)}
                                            onBlur={() => handleDomicilioBlur('nombreVia')}
                                            placeholder='Cervantes'
                                        />
                                        {renderInlineError('dom_nombreVia')}
                                    </div>
                                </div>

                                <div className="grid grid-cols-12 gap-4 mt-4">
                                    <div className="col-span-4 md:col-span-2 space-y-2">
                                        <Label htmlFor="dom-cp">C.P.</Label>
                                        <Input
                                            id="dom-cp"
                                            className={inputClass('dom_cp')}
                                            value={domicilio.cp}
                                            onChange={(e) => handleDomicilioChange('cp', e.target.value)}
                                            onBlur={() => handleDomicilioBlur('cp')}
                                            placeholder='28000'
                                        />
                                        {renderInlineError('dom_cp')}
                                    </div>
                                    <div className="col-span-4 md:col-span-2 space-y-2">
                                        <Label htmlFor="dom-numero">Nº</Label>
                                        <Input
                                            id="dom-numero"
                                            className={inputClass('dom_numero')}
                                            value={domicilio.numero}
                                            onChange={(e) => handleDomicilioChange('numero', e.target.value)}
                                            onBlur={() => handleDomicilioBlur('numero')}
                                            placeholder='1'
                                        />
                                        {renderInlineError('dom_numero')}
                                    </div>
                                    <div className="col-span-4 md:col-span-2 space-y-2">
                                        <Label htmlFor="dom-bloque">Bloque</Label>
                                        <Input
                                            id="dom-bloque"
                                            value={domicilio.bloque}
                                            onChange={(e) => handleDomicilioChange('bloque', e.target.value)}
                                        />
                                    </div>
                                    <div className="col-span-6 md:col-span-3 space-y-2">
                                        <Label htmlFor="dom-planta">Planta</Label>
                                        <Input
                                            id="dom-planta"
                                            value={domicilio.planta}
                                            onChange={(e) => handleDomicilioChange('planta', e.target.value)}
                                        />
                                    </div>
                                    <div className="col-span-6 md:col-span-3 space-y-2">
                                        <Label htmlFor="dom-puerta">Puerta</Label>
                                        <Input
                                            id="dom-puerta"
                                            value={domicilio.puerta}
                                            onChange={(e) => handleDomicilioChange('puerta', e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-12 gap-4 mt-4">
                                    <div className="col-span-12 md:col-span-12 space-y-2">
                                        <Label htmlFor="dom-alias">Alias en la comunidad</Label>
                                        <Input
                                            id="dom-alias"
                                            className={inputClass('dom_alias')}
                                            value={domicilio.alias}
                                            onChange={(e) => handleDomicilioChange('alias', e.target.value)}
                                            onBlur={() => handleDomicilioBlur('alias')}
                                            placeholder='El alias es el nombre con el que serás conocido en la comunidad'
                                        />
                                        {renderInlineError('dom_alias')}
                                    </div>
                                </div>

                                {opcion === 'unete' && (
                                    <div className="grid grid-cols-12 gap-4 mt-4">
                                        <div className="col-span-12 md:col-span-12 space-y-2">
                                            <Label htmlFor="dom-comentario">Comentario para el administrador (opcional)</Label>
                                            <textarea
                                                id="dom-comentario"
                                                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                                value={domicilio.comentario}
                                                onChange={(e) => handleDomicilioChange('comentario', e.target.value)}
                                                placeholder='Mensaje para el presidente...'
                                                rows={3}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-center gap-3 mt-8 mb-5">
                                <Button variant="secondary" onClick={handleSubmit} disabled={submitting}>
                                    {submitting ? 'Enviando...' : 'Confirmar'}
                                </Button>
                                <Button asChild variant="outline">
                                    <Link to="/auth/me">Cancelar</Link>
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default NewCommunityPage;
