const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const { SEED_NO_COMMUNITY_USER_ID, SEED_COMMUNITY_ID, SEED_SECOND_COMMUNITY_ID, seedAssets } = require('./seedAssets');

const prisma = new PrismaClient();

/*
Seed demo:
- Contraseña común: Sigeco-2026!
- nocommunity@ucm.es -> Sebastián SinComunidad, avatar y sesión activa, sin comunidad
- member@ucm.es -> Marta Miembro, MEMBER en Comunidad SIGECO, vivienda 2A y UPDATE_INFO pendiente
- vice@ucm.es -> Verónica Vicepresidente, VICE_PRESIDENT en Comunidad SIGECO, vivienda 1A
- president@ucm.es -> Pablo Presidente, PRESIDENT en Comunidad SIGECO, vivienda 1B
- suspended@ucm.es -> Sara Suspendida, MEMBER suspendida en Comunidad SIGECO, vivienda 3B
- double@ucm.es -> Diego Doble, MEMBER en Comunidad SIGECO y PRESIDENT en Comunidad SIGECO Norte
- access@ucm.es -> Marcos Miembro, MEMBER en Comunidad SIGECO Norte tras JOIN aprobada
- Comunidad SIGECO -> CIF H-12345674, accessCode SGECA234, avatar y 3 secciones de ayuda
- Comunidad SIGECO Norte -> CIF H-87654323, accessCode SGECB345 y 2 secciones de ayuda
*/

function buildResidentProperty(property) {
  return {
    label: property.label,
    country: property.country,
    province: property.province,
    municipality: property.municipality,
    streetType: property.streetType,
    streetName: property.streetName,
    postalCode: property.postalCode,
    streetNumberKm: property.streetNumberKm,
    block: property.block || null,
    floor: property.floor || null,
    door: property.door || null
  };
}

// Toda membership activa debe tener una vivienda (property) para respetar las reglas de negocio.
async function createMembershipWithProperty({ userId, communityId, role, alias, property, membershipExtraData = {} }) {
  const membership = await prisma.membership.create({
    data: { userId, communityId, role, alias, ...membershipExtraData }
  });

  const createdProperty = await prisma.property.create({
    data: { membershipId: membership.id, ...buildResidentProperty(property) }
  });

  await prisma.user.update({
    where: { id: userId },
    data: { lastActiveMembershipId: membership.id }
  });

  return { membership, property: createdProperty };
}

// Función auxiliar para crear un residente con su membership y vivienda asociada en un solo paso.
async function createCommunityResident({ firstName, lastName, email, phone, passwordHash, communityId, role, alias, property, membershipExtraData = {} }) {
  const user = await prisma.user.create({
    data: { firstName, lastName, email, phone, passwordHash, passwordChangedAt: new Date() }
  });

  const residentContext = await createMembershipWithProperty({ userId: user.id, communityId, role, alias, property, membershipExtraData });

  return { user, ...residentContext };
}

// Función principal para la carga de datos del seed en la Base de Datos.
async function main() {

  console.log('Seeding data...');

  // Todas las cuentas demo comparten la misma contraseña para simplificar el acceso.
  const password = 'Sigeco-2026!';
  const passwordHash = await bcrypt.hash(password, 10);

  // Limpieza total para partir de un estado determinista en cada ejecución.
  // El orden importa: primero se eliminan los datos de módulos que todavía
  // referencian memberships o comunidades para que el seed siga siendo
  // reejecutable aunque la base ya contenga votaciones, foro, calendario o news.
  await prisma.session.deleteMany();
  await prisma.communityRequestDetails.deleteMany();
  await prisma.communityRequest.deleteMany();
  await prisma.forumCommentLike.deleteMany();
  await prisma.forumPostLike.deleteMany();
  await prisma.pollVote.deleteMany();
  await prisma.forumComment.deleteMany();
  await prisma.forumPost.deleteMany();
  await prisma.pollOption.deleteMany();
  await prisma.poll.deleteMany();
  await prisma.calendarEvent.deleteMany();
  await prisma.communityNews.deleteMany();
  await prisma.communityHelpSection.deleteMany();
  await prisma.communityDocument.deleteMany();
  await prisma.communityFolder.deleteMany();
  await prisma.communityAvatar.deleteMany();
  await prisma.property.deleteMany();
  await prisma.membership.deleteMany();
  await prisma.community.deleteMany();
  await prisma.userAvatar.deleteMany();
  await prisma.user.deleteMany();

  // ---------------------------------------------------------------------------
  // Usuario sin comunidad
  // ---------------------------------------------------------------------------
  const noCommunityUser = await prisma.user.create({
    data: {
      id: SEED_NO_COMMUNITY_USER_ID,
      firstName: 'Sebastián',
      lastName: 'SinComunidad',
      email: 'nocommunity@ucm.es',
      phone: '600000001',
      passwordHash,
      passwordChangedAt: new Date()
    }
  });

  await prisma.userAvatar.create({
    data: {
      userId: noCommunityUser.id,
      storagePath: seedAssets.userAvatar.storagePath,
      mimeType: seedAssets.userAvatar.mimeType,
      sizeBytes: seedAssets.userAvatar.sizeBytes
    }
  });

  await prisma.session.create({
    data: {
      userId: noCommunityUser.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    }
  });

  // ---------------------------------------------------------------------------
  // Comunidad 1: Creación de Comunidad SIGECO
  // ---------------------------------------------------------------------------
  const primaryCommunity = await prisma.community.create({
    data: {
      id: SEED_COMMUNITY_ID,
      name: 'Comunidad SIGECO',
      cif: 'H-12345674',
      country: 'España',
      province: 'Madrid',
      municipality: 'Madrid',
      streetType: 'Calle',
      streetName: 'Mayor',
      postalCode: '28013',
      streetNumberKm: '12',
      accessCode: 'SGECA234'
    }
  });

  await prisma.communityAvatar.create({
    data: {
      communityId: primaryCommunity.id,
      storagePath: seedAssets.communityAvatar.storagePath,
      mimeType: seedAssets.communityAvatar.mimeType,
      sizeBytes: seedAssets.communityAvatar.sizeBytes
    }
  });

  // ---------------------------------------------------------------------------
  // Comunidad 1: miembros y su información
  // ---------------------------------------------------------------------------
  const primaryMemberResident = await createCommunityResident({
    firstName: 'Marta',
    lastName: 'Miembro',
    email: 'member@ucm.es',
    phone: '600000002',
    passwordHash,
    communityId: primaryCommunity.id,
    role: 'MEMBER',
    alias: 'Vecina 2A',
    property: {
      label: 'Vivienda 2A',
      country: 'España',
      province: 'Madrid',
      municipality: 'Madrid',
      streetType: 'Calle',
      streetName: 'Mayor',
      postalCode: '28013',
      streetNumberKm: '12',
      block: 'A',
      floor: '2',
      door: 'A'
    }
  });

  await createCommunityResident({
    firstName: 'Verónica',
    lastName: 'Vicepresidente',
    email: 'vice@ucm.es',
    phone: '600000003',
    passwordHash,
    communityId: primaryCommunity.id,
    role: 'VICE_PRESIDENT',
    alias: 'Vicepresi',
    property: {
      label: 'Vivienda 1A',
      country: 'España',
      province: 'Madrid',
      municipality: 'Madrid',
      streetType: 'Calle',
      streetName: 'Mayor',
      postalCode: '28013',
      streetNumberKm: '12',
      block: 'A',
      floor: '1',
      door: 'A'
    }
  });

  await createCommunityResident({
    firstName: 'Pablo',
    lastName: 'Presidente',
    email: 'president@ucm.es',
    phone: '600000004',
    passwordHash,
    communityId: primaryCommunity.id,
    role: 'PRESIDENT',
    alias: 'Presi',
    property: {
      label: 'Vivienda 1B',
      country: 'España',
      province: 'Madrid',
      municipality: 'Madrid',
      streetType: 'Calle',
      streetName: 'Mayor',
      postalCode: '28013',
      streetNumberKm: '12',
      block: 'A',
      floor: '1',
      door: 'B'
    }
  });

  await createCommunityResident({
    firstName: 'Sara',
    lastName: 'Suspendida',
    email: 'suspended@ucm.es',
    phone: '600000005',
    passwordHash,
    communityId: primaryCommunity.id,
    role: 'MEMBER',
    alias: 'Suspendida 3B',
    membershipExtraData: {
      suspendedAt: new Date(),
      suspendedUntil: new Date(Date.now() + (14 * 24 * 60 * 60 * 1000)),
      suspensionReason: 'Revision administrativa pendiente'
    },
    property: {
      label: 'Vivienda 3B',
      country: 'España',
      province: 'Madrid',
      municipality: 'Madrid',
      streetType: 'Calle',
      streetName: 'Mayor',
      postalCode: '28013',
      streetNumberKm: '12',
      block: 'A',
      floor: '3',
      door: 'B'
    }
  });

  const doubleResident = await createCommunityResident({
    firstName: 'Diego',
    lastName: 'Doble',
    email: 'double@ucm.es',
    phone: '600000006',
    passwordHash,
    communityId: primaryCommunity.id,
    role: 'MEMBER',
    alias: 'Doble 4A',
    property: {
      label: 'Vivienda 4A',
      country: 'España',
      province: 'Madrid',
      municipality: 'Madrid',
      streetType: 'Calle',
      streetName: 'Mayor',
      postalCode: '28013',
      streetNumberKm: '12',
      block: 'A',
      floor: '4',
      door: 'A'
    }
  });

  // ---------------------------------------------------------------------------
  // Comunidad 1: contexto comunitario
  // ---------------------------------------------------------------------------

  // Solicitud de actualización de información (UPDATE_IFNO) pendiente para Marta Miembro, con propuesta de cambio de alias.
  const primaryMemberUpdateRequest = await prisma.communityRequest.create({
    data: {
      communityId: primaryCommunity.id,
      userId: primaryMemberResident.user.id,
      type: 'UPDATE_INFO',
      status: 'PENDING',
      requestComment: 'Quiero actualizar mi alias en la comunidad.'
    }
  });

  await prisma.communityRequestDetails.create({
    data: {
      communityRequestId: primaryMemberUpdateRequest.id,
      proposedAlias: 'Marta 2A',
      label: primaryMemberResident.property.label,
      country: primaryMemberResident.property.country,
      province: primaryMemberResident.property.province,
      municipality: primaryMemberResident.property.municipality,
      streetType: primaryMemberResident.property.streetType,
      streetName: primaryMemberResident.property.streetName,
      postalCode: primaryMemberResident.property.postalCode,
      streetNumberKm: primaryMemberResident.property.streetNumberKm,
      block: primaryMemberResident.property.block,
      floor: primaryMemberResident.property.floor,
      door: primaryMemberResident.property.door
    }
  });

  await prisma.communityHelpSection.createMany({
    data: [
      {
        communityId: primaryCommunity.id,
        title: 'Bienvenido/a a la comunidad',
        description: 'Este portal centraliza avisos, documentación y gestiones habituales de la comunidad SIGECO.',
        sortOrder: 1
      },
      {
        communityId: primaryCommunity.id,
        title: 'Canales de contacto',
        description: 'Para incidencias comunes, utiliza las solicitudes del portal o contacta con el presidente y/o vicepresidente.',
        sortOrder: 2
      },
      {
        communityId: primaryCommunity.id,
        title: 'Normas básicas de convivencia',
        description: 'Respeta horarios de descanso, manten limpias las zonas comunes y comunica cualquier incidencia relevante.',
        sortOrder: 3
      }
    ]
  });

  // ---------------------------------------------------------------------------
  // Comunidad 2: Creación de Comunidad SIGECO Norte
  // ---------------------------------------------------------------------------
  const secondaryCommunity = await prisma.community.create({
    data: {
      id: SEED_SECOND_COMMUNITY_ID,
      name: 'Comunidad SIGECO Norte',
      cif: 'H-87654323',
      country: 'España',
      province: 'Madrid',
      municipality: 'Madrid',
      streetType: 'Avenida',
      streetName: 'Del Norte',
      postalCode: '28034',
      streetNumberKm: '8',
      accessCode: 'SGECB345'
    }
  });

  // ---------------------------------------------------------------------------
  // Comunidad 2: miembros y su información
  // ---------------------------------------------------------------------------

  // Usuario Diego Doble también es PRESIDENT en esta comunidad para cubrir el caso de contexto activo en múltiples comunidades.
  const secondaryPresidentContext = await createMembershipWithProperty({
    userId: doubleResident.user.id,
    communityId: secondaryCommunity.id,
    role: 'PRESIDENT',
    alias: 'Presi Norte',
    property: {
      label: 'Atico A',
      country: 'España',
      province: 'Madrid',
      municipality: 'Madrid',
      streetType: 'Avenida',
      streetName: 'Del Norte',
      postalCode: '28034',
      streetNumberKm: '8',
      block: 'B',
      floor: '5',
      door: 'A'
    }
  });

  const approvedJoinResident = await createCommunityResident({
    firstName: 'Marcos',
    lastName: 'Miembro',
    email: 'access@ucm.es',
    phone: '600000007',
    passwordHash,
    communityId: secondaryCommunity.id,
    role: 'MEMBER',
    alias: 'Vecino Norte 2C',
    property: {
      label: 'Vivienda 2C',
      country: 'España',
      province: 'Madrid',
      municipality: 'Madrid',
      streetType: 'Avenida',
      streetName: 'Del Norte',
      postalCode: '28034',
      streetNumberKm: '8',
      block: 'B',
      floor: '2',
      door: 'C'
    }
  });

  // Alta aprobada via JOIN (APPROVED) para cubrir el caso historico ya resuelto, comprobar visibilidad en perfil por solicitud (no ARCHIVED).
  const approvedJoinRequest = await prisma.communityRequest.create({
    data: {
      communityId: secondaryCommunity.id,
      userId: approvedJoinResident.user.id,
      type: 'JOIN',
      status: 'APPROVED',
      requestComment: 'Solicito acceso a la comunidad norte',
      resolutionMessage: 'Solicitud aprobada para alta en la comunidad',
      resolvedByMembershipId: secondaryPresidentContext.membership.id,
      resolvedAt: new Date()
    }
  });

  await prisma.communityRequestDetails.create({
    data: {
      communityRequestId: approvedJoinRequest.id,
      proposedAlias: approvedJoinResident.membership.alias,
      label: approvedJoinResident.property.label,
      country: approvedJoinResident.property.country,
      province: approvedJoinResident.property.province,
      municipality: approvedJoinResident.property.municipality,
      streetType: approvedJoinResident.property.streetType,
      streetName: approvedJoinResident.property.streetName,
      postalCode: approvedJoinResident.property.postalCode,
      streetNumberKm: approvedJoinResident.property.streetNumberKm,
      block: approvedJoinResident.property.block,
      floor: approvedJoinResident.property.floor,
      door: approvedJoinResident.property.door
    }
  });

  // ---------------------------------------------------------------------------
  // Comunidad 2: contexto comunitario
  // ---------------------------------------------------------------------------
  await prisma.communityHelpSection.createMany({
    data: [
      {
        communityId: secondaryCommunity.id,
        title: 'Acceso al portal norte',
        description: 'En esta comunidad demo puedes probar el cambio de contexto entre dos comunidades del mismo usuario.',
        sortOrder: 1
      },
      {
        communityId: secondaryCommunity.id,
        title: 'Gestion de nuevas altas',
        description: 'La comunidad norte incluye un ejemplo de solicitud JOIN aprobada.',
        sortOrder: 2
      }
    ]
  });

  console.log('Seed completed');
}

main()
  .catch((error) => { console.error('Seed error:', error); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
