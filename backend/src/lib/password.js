const bcrypt = require('bcryptjs');

/**
 * Servicio de hashing de contraseñas, utilizando bycrypt con un factor de coste de 10 rounds.
 */

const SALT_ROUNDS = 10;

// Genera el hash bcrypt de una contrasena de usuario.
async function hashPassword(password) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

// Verifica si una contraseña coincide con el hash almacenado.
async function verifyPassword(password, passwordHash) {
  return bcrypt.compare(password, passwordHash);
}

module.exports = { hashPassword, verifyPassword };