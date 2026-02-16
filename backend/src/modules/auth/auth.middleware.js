const AppError = require('../../lib/errors/AppError');
const sessionService = require('../../lib/session/session.service');

function getCookieConfig() {
  const sameSiteRaw = String(process.env.SESSION_SAMESITE || 'lax').toLowerCase();
  const sameSite = ['lax', 'strict', 'none'].includes(sameSiteRaw) ? sameSiteRaw : 'lax';
  const secure = String(process.env.SESSION_SECURE || 'false').toLowerCase() === 'true';

  return {
    httpOnly: true,
    sameSite,
    path: '/',
    secure
  };
}

async function requireAuth(req, res, next) {
  const sid = req.cookies?.sid;

  if (!sid) {
    return next(new AppError('Missing session cookie', 401, 'UNAUTHORIZED'));
  }

  try {
    const session = await sessionService.getValidSession(sid);

    if (!session || !session.user) {
      // Remove stale client cookie when session is expired/revoked/not found.
      res.cookie('sid', '', {
        ...getCookieConfig(),
        maxAge: 0
      });
      return next(new AppError('Invalid or expired session', 401, 'UNAUTHORIZED'));
    }

    req.user = {
      id: session.user.id,
      firstName: session.user.firstName,
      lastName: session.user.lastName,
      email: session.user.email,
      phone: session.user.phone
    };
    req.sessionId = session.id;

    await sessionService.touchSession(session.id);

    return next();
  } catch (error) {
    return next(new AppError('Internal error', 500, 'INTERNAL_ERROR'));
  }
}

module.exports = {
  requireAuth
};
