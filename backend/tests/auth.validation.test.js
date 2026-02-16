const test = require('node:test');
const assert = require('node:assert/strict');

const {
  registerSchema,
  loginSchema,
  changePasswordSchema,
  forgotPasswordSchema
} = require('../src/modules/auth/auth.validation');

test('register schema normalizes email and phone', () => {
  const parsed = registerSchema.parse({
    firstName: ' Ana ',
    lastName: ' Garcia ',
    email: 'ANA@UCM.ES',
    phone: '600 123 456',
    password: 'Password1'
  });

  assert.equal(parsed.email, 'ana@ucm.es');
  assert.equal(parsed.phone, '+34600123456');
});

test('login schema requires email or phone', () => {
  assert.throws(
    () =>
      loginSchema.parse({
        password: 'Password1'
      }),
    /email or phone is required/
  );
});

test('change password schema validates new password complexity', () => {
  assert.throws(
    () =>
      changePasswordSchema.parse({
        currentPassword: 'Password1',
        newPassword: 'weakpass',
        confirmNewPassword: 'weakpass'
      }),
    /at least one uppercase/
  );
});

test('change password schema requires matching confirmation', () => {
  assert.throws(
    () =>
      changePasswordSchema.parse({
        currentPassword: 'Password1',
        newPassword: 'Password2',
        confirmNewPassword: 'Password3'
      }),
    /must match/
  );
});

test('forgot password schema normalizes email', () => {
  const parsed = forgotPasswordSchema.parse({
    email: 'DEMO1@UCM.ES'
  });

  assert.equal(parsed.email, 'demo1@ucm.es');
});
