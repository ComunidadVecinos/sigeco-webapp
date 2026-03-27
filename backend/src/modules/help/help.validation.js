const { z } = require('zod');

// Validaciones HTTP del módulo help.

const { requiredTextSchema } = require('../../lib/validation/communityFields');
const { uuidFieldSchema, uuidParamSchema } = require('../../lib/validation/requestFields');

const communityIdParamSchema = uuidParamSchema('communityId');

const helpSectionTextTitleSchema = requiredTextSchema('title', 160);
const helpSectionDescriptionSchema = z.string().trim().min(1, 'La descripción es obligatoria');

const helpSectionParamsSchema = z.object({ communityId: uuidFieldSchema('communityId'), sectionId: uuidFieldSchema('sectionId') });
const helpSectionsQuerySchema = z.object({ communityId: uuidFieldSchema('communityId').optional() }).strict();

const createHelpSectionSchema = z.object({ title: helpSectionTextTitleSchema, description: helpSectionDescriptionSchema }).strict();

const updateHelpSectionSchema = z
  .object({ title: helpSectionTextTitleSchema.optional(), description: helpSectionDescriptionSchema.optional() })
  .strict()
  .refine((value) => Object.keys(value).length > 0, { message: 'Debes enviar al menos un campo editable de la sección de ayuda' });

// Reordenar exige ids únicos y una lista completa del estado.
const reorderHelpSectionsSchema = z
  .object({
    sectionIds: z
      .array(uuidFieldSchema('sectionIds'))
      .max(8, 'El campo sectionIds debe contener como máximo 8 elementos')
      .refine((items) => new Set(items).size === items.length, 'El campo sectionIds no puede contener valores duplicados')
  })
  .strict();

module.exports = { communityIdParamSchema, helpSectionParamsSchema, helpSectionsQuerySchema, createHelpSectionSchema, updateHelpSectionSchema, reorderHelpSectionsSchema };
