// Helpers de contraseña del backend.
// Encapsulan el hash y la verificación con bcrypt para no repartir la dependencia por los servicios.
const bcrypt = require('bcryptjs');
const SALT_ROUNDS = 10;

// Genera el hash bcrypt de una contraseña de usuario.
async function hashPassword(password) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

// Verifica si una contraseña coincide con el hash almacenado.
async function verifyPassword(password, passwordHash) {
  return bcrypt.compare(password, passwordHash);
}

module.exports = { hashPassword, verifyPassword };