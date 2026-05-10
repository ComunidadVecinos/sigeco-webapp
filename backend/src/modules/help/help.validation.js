const { z } = require('zod');

// Validaciones de help: preparan la lectura y edición de secciones de ayuda sin ensuciar el servicio.
// Flujo cubierto: entrada Express -> schemas Zod -> datos listos para el controlador/servicio.
// Expone schemas de lectura, creación, edición y reordenación de secciones de ayuda.
// Lo consumen las rutas pública y comunitaria del módulo.
const { requiredTextSchema } = require('../../lib/validation/communityFields');
const { uuidFieldSchema, uuidParamSchema } = require('../../lib/validation/requestFields');

// Params para rutas montadas directamente bajo una comunidad.
const communityIdParamSchema = uuidParamSchema('communityId');

// Campos base compartidos por creación y edición de secciones de ayuda.
const helpSectionTextTitleSchema = requiredTextSchema('title', 160);
const helpSectionDescriptionSchema = z.string().trim().min(1, 'La descripción es obligatoria');

// Params para rutas que trabajan sobre una sección concreta.
const helpSectionParamsSchema = z.object({ communityId: uuidFieldSchema('communityId'), sectionId: uuidFieldSchema('sectionId') });
// Query de GET /api/help/sections: permite pedir ayuda general o mezclarla con una comunidad concreta.
const helpSectionsQuerySchema = z.object({ communityId: uuidFieldSchema('communityId').optional() }).strict();

// Body de POST /sections: datos completos para crear una sección de ayuda comunitaria.
const createHelpSectionSchema = z.object({ title: helpSectionTextTitleSchema, description: helpSectionDescriptionSchema }).strict();

// Body de PATCH /sections/:sectionId: edición parcial de título y descripción.
const updateHelpSectionSchema = z
  .object({ title: helpSectionTextTitleSchema.optional(), description: helpSectionDescriptionSchema.optional() })
  .strict()
  .refine((value) => Object.keys(value).length > 0, { message: 'Debes enviar al menos un campo editable de la sección de ayuda' });

// Body de PUT /sections/order: exige ids únicos y una lista completa del estado actual.
const reorderHelpSectionsSchema = z
  .object({
    sectionIds: z
      .array(uuidFieldSchema('sectionIds'))
      .max(8, 'El campo sectionIds debe contener como máximo 8 elementos')
      .refine((items) => new Set(items).size === items.length, 'El campo sectionIds no puede contener valores duplicados')
  })
  .strict();

module.exports = { communityIdParamSchema, helpSectionParamsSchema, helpSectionsQuerySchema, createHelpSectionSchema, updateHelpSectionSchema, reorderHelpSectionsSchema };