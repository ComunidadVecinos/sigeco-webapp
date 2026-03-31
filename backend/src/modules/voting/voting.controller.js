// Controladores HTTP del módulo voting.
const votingRepository = require('./voting.repository');
const votingService = require('./voting.service');

async function createVoting(req, res) {
  const result = await votingService.createVoting({ userId: req.user.id }, req.params.communityId, req.body, votingRepository);
  return res.status(201).json(result);
}

async function getVotingList(req, res) {
  const result = await votingService.getVotingList({ userId: req.user.id }, req.params.communityId, req.query, votingRepository);
  return res.status(200).json(result);
}

async function voteOnVoting(req, res) {
  const result = await votingService.voteOnVoting(
    { userId: req.user.id },
    req.params.communityId,
    req.params.votingId,
    req.body,
    votingRepository
  );
  return res.status(200).json(result);
}

async function closeVoting(req, res) {
  const result = await votingService.closeVoting(
    { userId: req.user.id },
    req.params.communityId,
    req.params.votingId,
    votingRepository
  );
  return res.status(200).json(result);
}

async function deleteVoting(req, res) {
  const result = await votingService.deleteVoting(
    { userId: req.user.id },
    req.params.communityId,
    req.params.votingId,
    votingRepository
  );
  return res.status(200).json(result);
}

module.exports = { createVoting, getVotingList, voteOnVoting, closeVoting, deleteVoting };