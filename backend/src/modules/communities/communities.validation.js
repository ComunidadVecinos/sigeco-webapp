const { z } = require('zod');

// Validaciones HTTP del módulo communities.

const { addressSchema, optionalAddressDetailSchema, requiredTextSchema, normalizeCommunityCif, isValidCommunityOwnersCif } = require('../../lib/validation/communityFields');
const { uuidParamSchema } = require('../../lib/validation/requestFields');

// Alta de comunidad: el payload separa datos de comunidad y propiedad.
const createCommunitySchema = z.object({
  community: addressSchema.extend({
    name: requiredTextSchema('name', 160),
    cif: z.string().trim().min(1, 'El CIF es obligatorio').transform(normalizeCommunityCif).refine(isValidCommunityOwnersCif, 'El CIF debe tener formato H seguido de 8 cifras')
  }),
  creatorProperty: addressSchema.extend({ block: optionalAddressDetailSchema, floor: optionalAddressDetailSchema, door: optionalAddressDetailSchema }),
  alias: requiredTextSchema('alias', 120)
});

const communityIdParamSchema = uuidParamSchema('communityId');

// Patch parcial: solo se admiten los campos explicitamente editables.
const updateCommunitySchema = z
  .object({
    name: requiredTextSchema('name', 160).optional(),
    country: addressSchema.shape.country.optional(),
    province: addressSchema.shape.province.optional(),
    municipality: addressSchema.shape.municipality.optional(),
    streetType: addressSchema.shape.streetType.optional(),
    streetName: addressSchema.shape.streetName.optional(),
    postalCode: addressSchema.shape.postalCode.optional(),
    streetNumberKm: addressSchema.shape.streetNumberKm.optional()
  })
  .strict().refine((value) => Object.keys(value).length > 0, { message: 'Debes enviar al menos un campo editable de la comunidad' });

// El borrado exige doble confirmación (texto + password actual) porque elimina y afecta a otros usuarios de la comunidad.
const deleteCommunitySchema = z
  .object({
    confirmationText: z.string().trim().min(1, 'El texto de confirmación es obligatorio'),
    currentPassword: z.string().trim().min(1, 'La contraseña actual es obligatoria')
  }).strict();

module.exports = { createCommunitySchema, communityIdParamSchema, updateCommunitySchema, deleteCommunitySchema };
