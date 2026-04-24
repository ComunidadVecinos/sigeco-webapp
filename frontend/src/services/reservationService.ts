import api from './api';

export type Type = 'SHARED' | 'EXCLUSIVE';

export interface Days{
    monday: boolean;
    tuesday: boolean;
    wednesday: boolean;
    thursday: boolean;
    friday: boolean;
    saturday: boolean;
    sunday: boolean;
}

export interface Space {
    id: string;
    name: string;
    description: string | null;
    colorHex: string;
    isActive: boolean;
    totalCapacity: number;
    occupancyMode: Type;
    maxSeatsPerBooking: number | null;
    openingTime: string;
    closingTime: string;
    slotMinutes: number;
    allowedDays: Days;
    maxConsecutiveSlots: number;
    minAdvanceMinutes: number;
    maxAdvanceDays: number;
    cancellationNoticeMinutes: number;
    createdAt: string;
    updatedAt: string;
}

export interface SpaceRef{
    id: string;
    name: string;
    colorHex: string;
    isActive: boolean;
    occupancyMode: Type;
    totalCapacity: number;
    maxSeatsPerBooking: number | null;
}

export interface BookingOwner {
    membershipId: string;
    alias: string | null;
    role: string;
}

export interface Booking {
    id: string;
    status: 'ACTIVE' | 'CANCELLED';
    date: string;
    startTime: string;
    endTime: string;
    slotCount: number;
    requestedSeats: number;
    startsAt: string;
    endsAt: string;
    createdAt: string;
    updatedAt: string;
    cancelledAt: string | null;
    cancellationReason: string | null;
    canCancel: boolean;
    space: SpaceRef;
    owner: BookingOwner;
    cancelledBy: BookingOwner | null;
}

export interface Slot {
    slotIndex: number;
    startTime: string;
    endTime: string;
    available: boolean;
    bookedSeats: number;
    remainingCapacity: number;
}

export interface BookingRules {
    maxConsecutivesSlots: number;
    minAdvanceMinutes: number;
    maxAdvanceDays: number;
    cancellationNoticeMinutes: number;
    oneBookingPerDay: boolean;
}

export interface AvailabilityResponse {
    space: Space;
    bookingRules: BookingRules;
    date: string;
    slots: Slot[];
}

export interface Pagination {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
}

// ----------- ESPACIOS ----------- //

//Obtener todos los espacios
export const getSpaces = (communityId: string, filters : {
    page?: number;
    pageSize?: number;
    search?: string;
    status?: string;
}) => api.get<{items: Space[]; pagination: Pagination }>(
    `/api/communities/${communityId}/reservations/spaces`, {params: {page: filters.page ?? 1, pageSize: filters.pageSize ?? 100, search: filters.search || undefined, status: filters.status || 'active'}}
);

//Obtener un espacio
export const getSpace = (communityId: string, spaceId: string) => 
    api.get<{space: Space}>(`/api/communities/${communityId}/reservations/spaces/${spaceId}`);

//Crear un espacio
export const createSpace = (communityId: string, data: Partial<Space>) =>
    api.post<{space: Space}>(`/api/communities/${communityId}/reservations/spaces`, data);

//Modificar espacio
export const updateSpace = (communityId: string, spaceId: string, data: Partial<Space>) =>
    api.patch<{space: Space}>(`/api/communities/${communityId}/reservations/spaces/${spaceId}`, data);

//Modificar estado del espacio
export const changeSpaceStatus = (communityId: string, spaceId: string, isActive: boolean) =>
    api.patch<{space: Space}>(`/api/communities/${communityId}/reservations/spaces/${spaceId}/status`, {isActive});

//Eliminar espacio
export const deleteSpace = (communityId: string, spaceId: string) => 
    api.delete(`/api/communities/${communityId}/reservations/spaces/${spaceId}`);

// ----------- DISPONIBILIDAD ----------- //

export const getAvailability = (communityId: string, spaceId: string, date: string) => 
    api.get<AvailabilityResponse>(`/api/communities/${communityId}/reservations/spaces/${spaceId}/availability`, {params: {date}});

// ----------- RESERVAS ----------- //

//Crear una reserva
export const createBooking = (communityId: string, data: {
    spaceId: string;
    date: string;
    startTime: string;
    slotCount: number;
    requestedSeats?: number;
}) => api.post<{booking: Booking}>(`/api/communities/${communityId}/reservations/bookings`, data);

//Obtener reservas de un usuario
export const getMyBookings = (communityId: string, filters: {
    page?: number;
    pageSize?: number;
    scope?: string;
    spaceId?: string;
}) => api.get<{items: Booking[]; pagination: Pagination}>(
    `/api/communities/${communityId}/reservations/bookings/me`,
    {params: {page: filters.page ?? 1, pageSize: filters.pageSize ?? 10, scope: filters.scope || 'upcoming', spaceId: filters.spaceId || undefined}}
);

//Obtener detalle de reserva
export const getBookingDetails = (communityId: string, bookingId: string) =>
    api.get<{booking: Booking}>(`/api/communities/${communityId}/reservations/bookings/${bookingId}`);

//Cancelar reserva
export const cancelBooking = (communityId: string, bookingId: string, reason?: string) => api.post<{booking: Booking}>(`/api/communities/${communityId}/reservations/bookings/${bookingId}/cancel`, reason ? {reason} : {});

//Obtener todas las reservas de la comunidad
export const getCommunityBookings = (communityId: string, filters: {
    page?: number;
    pageSize?: number;
    status?: string;
    spaceId?: string;
    from?: string;
    to?: string;
}) => api.get<{items: Booking[]; pagination: Pagination}>(
    `/api/communities/${communityId}/reservations/bookings`, 
    {params: {page: filters.page ?? 1, pageSize: filters.pageSize ?? 10, status: filters.status || 'active', spaceId: filters.spaceId || undefined, from: filters.from || undefined, to: filters.to || undefined}}
);