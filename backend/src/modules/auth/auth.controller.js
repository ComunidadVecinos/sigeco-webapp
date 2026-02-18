const authService = require('./auth.service');
const sessionService = require('../../lib/session/session.service');

function setSessionCookie(res, sid) {
  res.cookie('sid', sid, {
    ...sessionService.getCookieConfig(),
    maxAge: sessionService.getSessionTtlMs()
  });
}

async function register(req, res, next) {
  try {
    const { sid, user } = await authService.registerUser(req.body);

    setSessionCookie(res, sid);

    return res.status(201).json(user);
  } catch (error) {
    return next(error);
  }
}

async function login(req, res, next) {
  try {
    const { sid, user } = await authService.loginUser(req.body);

    setSessionCookie(res, sid);

    return res.status(200).json(user);
  } catch (error) {
    return next(error);
  }
}

async function logout(req, res, next) {
  try {
    const result = await authService.logoutUser();

    res.cookie('sid', '', {
      ...sessionService.getCookieConfig(),
      maxAge: 0
    });

    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
}

async function me(req, res, next) {
  try {
    return res.status(200).json(req.user);
  } catch (error) {
    return next(error);
  }
}

async function changePassword(req, res, next) {
  try {
    const result = await authService.changePassword(
      req.user.id,
      req.body.currentPassword,
      req.body.newPassword
    );

    res.cookie('sid', '', {
      ...sessionService.getCookieConfig(),
      maxAge: 0
    });

    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
}

async function forgotPassword(req, res, next) {
  try {
    const result = await authService.forgotPassword(req.body.email);
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  register,
  login,
  logout,
  me,
  changePassword,
  forgotPassword
};
