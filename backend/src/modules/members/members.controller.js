// Controladores HTTP del módulo members.
const membersRepository = require('./members.repository');
const membersService = require('./members.service');

async function getCommunityMembers(req, res) {
  const result = await membersService.getCommunityMembers({ userId: req.user.id }, { communityId: req.params.communityId, ...req.query }, membersRepository);
  return res.status(200).json(result);
}

async function leaveMyCommunity(req, res) {
  // Necesita dentificador de sesión: abandonar una comunidad invalida la membership activa del usuario.
  const result = await membersService.leaveMyCommunity(
    { userId: req.user.id, sessionId: req.session.id, activeMembershipId: req.session.activeMembershipId || null }, 
    { communityId: req.params.communityId, ...req.body }, membersRepository
  );
  return res.status(200).json(result);
}

async function expelCommunityMember(req, res) {
  const result = await membersService.expelCommunityMember(
    { userId: req.user.id },
    { communityId: req.params.communityId, memberId: req.params.memberId, ...req.body },
    membersRepository
  );
  return res.status(200).json(result);
}

async function assignCommunityMemberRole(req, res) {
  const result = await membersService.assignCommunityMemberRole(
    { userId: req.user.id }, 
    { communityId: req.params.communityId, memberId: req.params.memberId, role: req.params.role }, 
    membersRepository
  );
  return res.status(200).json(result);
}

async function suspendCommunityMember(req, res) {
  const result = await membersService.suspendCommunityMember(
    { userId: req.user.id }, 
    { communityId: req.params.communityId, memberId: req.params.memberId, ...req.body }, 
    membersRepository
  );
  return res.status(200).json(result);
}

async function cancelCommunityMemberSuspension(req, res) {
  const result = await membersService.cancelCommunityMemberSuspension(
    { userId: req.user.id }, 
    { communityId: req.params.communityId, memberId: req.params.memberId }, 
    membersRepository
  );
  return res.status(200).json(result);
}

module.exports = { getCommunityMembers, leaveMyCommunity, expelCommunityMember, assignCommunityMemberRole, suspendCommunityMember, cancelCommunityMemberSuspension };
