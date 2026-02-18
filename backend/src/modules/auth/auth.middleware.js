const AppError = require('../../lib/errors/AppError');
const sessionService = require('../../lib/session/session.service');
const authRepository = require('./auth.repository');

async function requireAuth(req, res, next) {
  const sid = req.cookies?.sid;

  if (!sid) {
    return next(new AppError('Missing session cookie', 401, 'UNAUTHORIZED'));
  }

  try {
    const session = sessionService.verifySessionToken(sid);

    if (!session) {
      res.cookie('sid', '', {
        ...sessionService.getCookieConfig(),
        maxAge: 0
      });
      return next(new AppError('Invalid or expired session', 401, 'UNAUTHORIZED'));
    }

    const user = await authRepository.findUserById(session.userId);
    if (!user || user.authVersion !== session.authVersion) {
      res.cookie('sid', '', {
        ...sessionService.getCookieConfig(),
        maxAge: 0
      });
      return next(new AppError('Invalid or expired session', 401, 'UNAUTHORIZED'));
    }

    req.user = {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone
    };

    return next();
  } catch (error) {
    return next(new AppError('Internal error', 500, 'INTERNAL_ERROR'));
  }
}

module.exports = {
  requireAuth
};
