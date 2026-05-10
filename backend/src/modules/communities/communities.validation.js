const { z } = require('zod');

// Validaciones de communities: preparan los datos de alta, edición y borrado de la comunidad.
// Flujo cubierto: entrada Express -> schemas Zod -> datos listos para el servicio.
// Expone schemas de alta, edición, borrado y params base de comunidad.
// Lo consumen las rutas antes de llegar a los controladores.
const { addressSchema, optionalAddressDetailSchema, requiredTextSchema, normalizeCommunityCif, isValidCommunityOwnersCif } = require('../../lib/validation/communityFields');
const { uuidParamSchema } = require('../../lib/validation/requestFields');

// Body de POST /: el payload separa datos de comunidad, vivienda inicial y alias del creador.
const createCommunitySchema = z.object({
  community: addressSchema.extend({
    name: requiredTextSchema('name', 160),
    cif: z.string().trim().min(1, 'El CIF es obligatorio').transform(normalizeCommunityCif).refine(isValidCommunityOwnersCif, 'El CIF debe tener formato H seguido de 8 cifras')
  }),
  creatorProperty: addressSchema.extend({ block: optionalAddressDetailSchema, floor: optionalAddressDetailSchema, door: optionalAddressDetailSchema }),
  alias: requiredTextSchema('alias', 120)
});

// Params para rutas que trabajan sobre una comunidad concreta.
const communityIdParamSchema = uuidParamSchema('communityId');

// Body de PATCH /:communityId: edición parcial de los datos institucionales permitidos.
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

// Body de DELETE /:communityId: doble confirmación para una operación que afecta a toda la comunidad.
const deleteCommunitySchema = z
  .object({
    confirmationText: z.string().trim().min(1, 'El texto de confirmación es obligatorio'),
    currentPassword: z.string().trim().min(1, 'La contraseña actual es obligatoria')
  }).strict();

module.exports = { createCommunitySchema, communityIdParamSchema, updateCommunitySchema, deleteCommunitySchema };