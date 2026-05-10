//Utilidades de fecha/hora: convierte entre UTC (API) y zona horaria de negocio (Europe/Madrid)
import { DateTime } from 'luxon';

// El frontend siempre muestra la hora de negocio en Europe/Madrid, aunque los instantes reales viajen por API en UTC ISO.
export const BUSINESS_TIME_ZONE = 'Europe/Madrid';

//Parsea una cadena ISO a un instante UTC de Luxon
function parseUtcInstant(iso: string) {
    return DateTime.fromISO(iso, { setZone: true }).toUTC();
}

export function businessFormToUtcIso(date: string, time: string) {
    // Convierte el valor introducido en formularios (fecha y hora visibles para la comunidad) al instante UTC que espera la API.
    return DateTime.fromFormat(`${date} ${time}`, 'yyyy-MM-dd HH:mm', { zone: BUSINESS_TIME_ZONE, setZone: true }).toUTC().toISO({ suppressMilliseconds: false });
}

export function formatBusinessDateOnly(date: string, format = 'dd/MM/yyyy') {
    return DateTime.fromFormat(date, 'yyyy-MM-dd', { zone: BUSINESS_TIME_ZONE, setZone: true }).setLocale('es').toFormat(format);
}

export function utcIsoToBusinessForm(iso: string) {
    // Algunas pantallas siguen trabajando con inputs separados de fecha/hora; este helper reconstruye esos valores desde el UTC recibido por backend.
    const instant = parseUtcInstant(iso).setZone(BUSINESS_TIME_ZONE);
    return { date: instant.toFormat('yyyy-MM-dd'), time: instant.toFormat('HH:mm') };
}

export function formatUtcIsoInBusinessZone(iso: string | null | undefined, format = "dd/MM/yyyy HH:mm") {
    if (!iso) {
        return '';
    }
    // Todo instante real expuesto por backend se renderiza en Madrid para no depender de la configuración local del navegador.
    return parseUtcInstant(iso).setZone(BUSINESS_TIME_ZONE).setLocale('es').toFormat(format);
}

//Obtiene la clave de fecha (yyyy-MM-dd) en zona de negocio a partir de un ISO UTC
export function getBusinessDateKeyFromUtcIso(iso: string) {
    return parseUtcInstant(iso).setZone(BUSINESS_TIME_ZONE).toFormat('yyyy-MM-dd');
}