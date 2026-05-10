const crypto = require('crypto');

// Servicio de news: gobierna la publicación de noticias, su imagen y su reflejo en calendario.
// Flujo cubierto: usuario autenticado -> permisos/reglas de noticia -> repositorio/storage/calendar.
// Expone casos de uso para crear, listar, leer, editar y borrar noticias e imágenes.
// Lo consumen los controladores HTTP del módulo.
const { ConflictError, NotFoundError, ValidationError } = require('../../lib/errors');
const { startOfBusinessDayUtc, startOfNextBusinessDayUtc } = require('../../lib/datetime/businessTime');
const { inspectImageBuffer } = require('../../lib/storage/imageMetadata');
const storageService = require('../../lib/storage/storage');
const membersRepository = require('../members/members.repository');
const membersService = require('../members/members.service');
const calendarRepository = require('../calendar/calendar.repository');
const { buildNewsAutomaticCalendarEvents } = require('../calendar/calendar.reminder');

const DELETED_NEWS_CREATOR_ALIAS = 'Usuario eliminado';

// --- Helpers comunes ---
function buildValidationDetail(field, message, location = 'body') {
  return [{ field, location, message }];
}

function buildPagination(page, pageSize, total) {
  return { page, pageSize, total, totalPages: total === 0 ? 0 : Math.ceil(total / pageSize) };
}

function isEventNews(news) {
  return Boolean(news?.eventStartsAt);
}

// --- Noticias comunitarias: mapeo de salida ---
function mapNewsItem(news) {
  const creatorAlias = news.authorMembership ? news.authorMembership.alias || null : DELETED_NEWS_CREATOR_ALIAS;

  return {
    id: news.id,
    title: news.title,
    description: news.description,
    imageUrl: storageService.getPublicFileUrl(news.imageStoragePath || null),
    creator: { alias: creatorAlias },
    createdAt: news.createdAt.toISOString(),
    editedAt: news.editedAt ? news.editedAt.toISOString() : null,
    isEvent: Boolean(news.eventStartsAt),
    eventStartsAt: news.eventStartsAt ? news.eventStartsAt.toISOString() : null,
    eventEndsAt: news.eventEndsAt ? news.eventEndsAt.toISOString() : null
  };
}

// --- Noticias comunitarias: reglas de evento ---
function buildNewsEventData(input) {
  const eventStartsAt = input.eventStartsAt || null;
  const eventEndsAt = input.eventEndsAt || null;

  if (eventEndsAt && !eventStartsAt) {
    throw new ValidationError(
      buildValidationDetail('eventEndsAt', 'La fecha de fin requiere también la fecha de inicio'),
      { message: 'La fecha del evento no es válida' }
    );
  }

  if (eventStartsAt && eventEndsAt && eventEndsAt <= eventStartsAt) {
    throw new ValidationError(
      buildValidationDetail('eventEndsAt', 'La fecha y hora fin deben ser posteriores a la fecha y hora inicio'),
      { message: 'La fecha del evento no es válida' }
    );
  }

  return { eventStartsAt, eventEndsAt };
}

// Si el PATCH no toca el evento, conservamos el rango actual; si envía null/null, lo elimina.
function resolveNextEventData(existingNews, input) {
  const eventFieldsAreMissing = input.eventStartsAt === undefined && input.eventEndsAt === undefined;
  if (eventFieldsAreMissing) {
    return { eventStartsAt: existingNews.eventStartsAt, eventEndsAt: existingNews.eventEndsAt };
  }
  if (input.eventStartsAt === null && input.eventEndsAt === null) {
    return { eventStartsAt: null, eventEndsAt: null };
  }
  return buildNewsEventData(input);
}

function hasEventScheduleChanged(existingNews, nextEventData) {
  const existingStartsAt = existingNews.eventStartsAt ? existingNews.eventStartsAt.getTime() : null;
  const existingEndsAt = existingNews.eventEndsAt ? existingNews.eventEndsAt.getTime() : null;
  const nextStartsAt = nextEventData.eventStartsAt ? nextEventData.eventStartsAt.getTime() : null;
  const nextEndsAt = nextEventData.eventEndsAt ? nextEventData.eventEndsAt.getTime() : null;
  return existingStartsAt !== nextStartsAt || existingEndsAt !== nextEndsAt;
}

// --- Noticias comunitarias: imagen opcional ---
function buildNewsImageData(imageFile) {
  if (!imageFile) {
    return null;
  }
  const image = inspectImageBuffer(imageFile.buffer);
  return {
    extension: image.extension,
    mimeType: imageFile.mimetype,
    sizeBytes: imageFile.size
  };
}

async function prepareNewsImageChange({ communityId, newsId, previousStoragePath, imageFile }) {
  const imageData = buildNewsImageData(imageFile);
  if (!imageData) {
    return { imageData: null, storedImage: null };
  }
  const storedImage = await storageService.replaceCommunityNewsImageFile({
    communityId,
    newsId,
    previousStoragePath,
    buffer: imageFile.buffer,
    extension: imageData.extension
  });
  return { imageData, storedImage };
}

function buildStoredImageFields(storedImage, imageData) {
  if (!storedImage || !imageData) {
    return {};
  }
  return {
    imageStoragePath: storedImage.storagePath,
    imageMimeType: imageData.mimeType,
    imageSizeBytes: imageData.sizeBytes
  };
}

async function commitNewsImageChange(storedImage, { communityId, newsId }) {
  await storageService.commitStoredFileSafely(
    storedImage,
    'No se ha podido finalizar la limpieza del almacenamiento de la imagen de la noticia',
    { communityId, newsId }
  );
}

async function rollbackNewsImageChange(storedImage, { communityId, newsId, operation }) {
  await storageService.rollbackStoredFileSafely(
    storedImage,
    `No se ha podido restaurar la imagen previa de la noticia tras un error en la ${operation}`,
    { communityId, newsId }
  );
}

async function deleteStoredNewsImage(storagePath, { communityId, newsId, reason }) {
  await storageService.deleteStoredFileSafely(storagePath, reason, { communityId, newsId });
}

function buildNewsUpdateData(input, nextEventData, storedImage, imageData) {
  const hasEventPayload = input.eventStartsAt !== undefined || input.eventEndsAt !== undefined;

  return {
    ...(input.title !== undefined ? { title: input.title } : {}),
    ...(input.description !== undefined ? { description: input.description } : {}),
    ...buildStoredImageFields(storedImage, imageData),
    ...(hasEventPayload ? { eventStartsAt: nextEventData.eventStartsAt, eventEndsAt: nextEventData.eventEndsAt } : {}),
    editedAt: new Date()
  };
}

// --- Noticias comunitarias: proyección automática en calendario ---
function buildNewsCalendarEvents(news) {
  return buildNewsAutomaticCalendarEvents({
    title: news.title,
    eventStartsAt: news.eventStartsAt,
    eventEndsAt: news.eventEndsAt
  });
}

async function replaceNewsCalendarEvents(tx, communityId, news) {
  const calendarEvents = buildNewsCalendarEvents(news);
  if (calendarEvents.length === 0) {
    return;
  }
  await calendarRepository.replaceAutomaticEventsInDb(tx, {
    communityId,
    type: 'NEWS',
    sourceEntityId: news.id,
    events: calendarEvents
  });
}

async function removeNewsCalendarEvents(tx, communityId, newsId) {
  await calendarRepository.softDeleteAutomaticEventInDb(tx, {
    communityId,
    type: 'NEWS',
    sourceEntityId: newsId
  });
}

// El calendario solo se toca si la noticia era o pasa a ser un evento.
async function syncUpdatedNewsCalendar(tx, { communityId, newsId, existingNews, updatedNews, eventScheduleChanged }) {
  const previouslyWasEvent = isEventNews(existingNews);
  const willBeEvent = isEventNews(updatedNews);
  if (!previouslyWasEvent && !willBeEvent) {
    return;
  }
  if (previouslyWasEvent && !willBeEvent) {
    await removeNewsCalendarEvents(tx, communityId, newsId);
    return;
  }
  if (!previouslyWasEvent && willBeEvent) {
    await replaceNewsCalendarEvents(tx, communityId, updatedNews);
    return;
  }
  if (eventScheduleChanged) {
    await replaceNewsCalendarEvents(tx, communityId, updatedNews);
  }
}

// --- Helpers de acceso y existencia ---
async function requireNewsMembershipAccess(userId, communityId) {
  return membersService.requireCommunityMembershipAccess(userId, communityId, membersRepository);
}

async function requireNewsAdministrativeAccess(userId, communityId) {
  return membersService.requireAdministrativeCommunityAccess(userId, communityId, membersRepository);
}

async function requireExistingNews(communityId, newsId, newsRepository) {
  const news = await newsRepository.findNewsById({ communityId, newsId });
  if (!news) {
    throw new NotFoundError('Noticia no encontrada');
  }
  return news;
}

function assertNewsIsAvailable(news, message) {
  if (!news.deletedAt) {
    return;
  }
  throw new ConflictError(message);
}

// --- Noticias comunitarias: POST de creación ---
async function createNews(context, communityId, input, newsRepository) {
  const { membership } = await requireNewsAdministrativeAccess(context.userId, communityId);
  const eventData = buildNewsEventData(input);
  const newsId = crypto.randomUUID();
  const { imageData, storedImage } = await prepareNewsImageChange({
    communityId,
    newsId,
    previousStoragePath: null,
    imageFile: input.imageFile
  });

  try {
    const createdNews = await newsRepository.withTransaction(async (tx) => {
      const news = await newsRepository.createNews(tx, {
        id: newsId,
        communityId,
        authorMembershipId: membership.id,
        title: input.title,
        description: input.description,
        eventStartsAt: eventData.eventStartsAt,
        eventEndsAt: eventData.eventEndsAt,
        ...buildStoredImageFields(storedImage, imageData)
      });

      await replaceNewsCalendarEvents(tx, communityId, news);
      return news;
    });
    await commitNewsImageChange(storedImage, { communityId, newsId });
    return mapNewsItem(createdNews);
  }
  catch (error) {
    await rollbackNewsImageChange(storedImage, { communityId, newsId, operation: 'creación' });
    throw error;
  }
}

// --- Noticias comunitarias: GET ---
async function getNewsList(context, communityId, input, newsRepository) {
  await requireNewsMembershipAccess(context.userId, communityId);

  const pageResult = await newsRepository.findNewsPage({
    communityId,
    search: input.search || undefined,
    createdFrom: input.from ? startOfBusinessDayUtc(input.from) : undefined,
    createdToExclusive: input.to ? startOfNextBusinessDayUtc(input.to) : undefined,
    eventType: input.eventType,
    page: input.page,
    pageSize: input.pageSize
  });

  return {
    items: pageResult.items.map(mapNewsItem),
    pagination: buildPagination(input.page, input.pageSize, pageResult.total)
  };
}

async function getNewsDetail(context, communityId, newsId, newsRepository) {
  await requireNewsMembershipAccess(context.userId, communityId);

  const news = await requireExistingNews(communityId, newsId, newsRepository);
  if (news.deletedAt) {
    throw new NotFoundError('Noticia no encontrada');
  }
  return mapNewsItem(news);
}

// --- Noticias comunitarias: PATCH ---
async function updateNews(context, communityId, newsId, input, newsRepository) {
  await requireNewsAdministrativeAccess(context.userId, communityId);

  const existingNews = await requireExistingNews(communityId, newsId, newsRepository);
  assertNewsIsAvailable(existingNews, 'La noticia ya no está disponible');

  const nextEventData = resolveNextEventData(existingNews, input);
  const eventScheduleChanged = hasEventScheduleChanged(existingNews, nextEventData);
  const { imageData, storedImage } = await prepareNewsImageChange({
    communityId,
    newsId,
    previousStoragePath: existingNews.imageStoragePath || null,
    imageFile: input.imageFile
  });

  try {
    const updatedNews = await newsRepository.withTransaction(async (tx) => {
      const news = await newsRepository.updateNews(tx, {
        communityId,
        newsId,
        data: buildNewsUpdateData(input, nextEventData, storedImage, imageData)
      });

      if (!news) {
        throw new ConflictError('No se ha podido actualizar la noticia');
      }
      await syncUpdatedNewsCalendar(tx, {
        communityId,
        newsId,
        existingNews,
        updatedNews: news,
        eventScheduleChanged
      });
      return news;
    });
    await commitNewsImageChange(storedImage, { communityId, newsId });
    return mapNewsItem(updatedNews);
  }
  catch (error) {
    await rollbackNewsImageChange(storedImage, { communityId, newsId, operation: 'actualización' });
    throw error;
  }
}

// --- Noticias comunitarias: DELETE lógico ---
async function deleteNews(context, communityId, newsId, newsRepository) {
  await requireNewsAdministrativeAccess(context.userId, communityId);

  const existingNews = await requireExistingNews(communityId, newsId, newsRepository);
  assertNewsIsAvailable(existingNews, 'La noticia ya está eliminada');

  const deletedAt = new Date();
  await newsRepository.withTransaction(async (tx) => {
    const deleted = await newsRepository.softDeleteNews(tx, { communityId, newsId, deletedAt });
    if (!deleted) {
      throw new ConflictError('No se ha podido eliminar la noticia');
    }
    await removeNewsCalendarEvents(tx, communityId, newsId);
  });

  await deleteStoredNewsImage(existingNews.imageStoragePath, {
    communityId,
    newsId,
    reason: 'No se ha podido eliminar la imagen de la noticia tras el borrado lógico'
  });
  return { deleted: true, newsId };
}

async function deleteNewsImage(context, communityId, newsId, newsRepository) {
  await requireNewsAdministrativeAccess(context.userId, communityId);

  const existingNews = await requireExistingNews(communityId, newsId, newsRepository);
  assertNewsIsAvailable(existingNews, 'La noticia ya no está disponible');
  if (!existingNews.imageStoragePath) {
    throw new ConflictError('La noticia no tiene imagen');
  }

  const updatedNews = await newsRepository.withTransaction(async (tx) => {
    const news = await newsRepository.removeNewsImage(tx, { communityId, newsId });
    if (!news) {
      throw new ConflictError('No se ha podido eliminar la imagen de la noticia');
    }
    return news;
  });

  await deleteStoredNewsImage(existingNews.imageStoragePath, {
    communityId,
    newsId,
    reason: 'No se ha podido eliminar el archivo de imagen tras borrar la referencia en la noticia'
  });
  return mapNewsItem(updatedNews);
}

module.exports = { createNews, getNewsList, getNewsDetail, updateNews, deleteNews, deleteNewsImage };