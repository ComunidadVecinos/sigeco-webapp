const jwt = require('jsonwebtoken');
const { createUser, validateUser } = require('./auth.service');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';
const JWT_EXPIRES_IN = '1h';

function signToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

// POST /api/auth/register
async function register(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await createUser(email, password);
    const token = signToken(user);

    res.cookie('token', token, {
      httpOnly: true,
      secure: false, // true in HTTPS production
      sameSite: 'lax',
      maxAge: 60 * 60 * 1000
    });

    res.status(201).json({
      id: user.id,
      email: user.email
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(400).json({ error: err.message || 'Registration failed' });
  }
}

// POST /api/auth/login
async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await validateUser(email, password);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = signToken(user);

    res.cookie('token', token, {
      httpOnly: true,
      secure: false, // true in HTTPS production
      sameSite: 'lax',
      maxAge: 60 * 60 * 1000
    });

    res.json({
      id: user.id,
      email: user.email
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
}

// POST /api/auth/logout
function logout(req, res) {
  res.clearCookie('token');
  res.json({ message: 'Logged out' });
}

module.exports = {
  register,
  login,
  logout
};
