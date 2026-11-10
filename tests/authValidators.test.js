import test from 'node:test';
import assert from 'node:assert/strict';
import { registerSchema, loginSchema } from '../src/validators/authValidators.js';

const validRequest = (password) => ({
  body: { name: 'Test User', email: 'test@example.com', password },
  params: {},
  query: {}
});

test('registration accepts a valid password up to bcrypt 72-byte limit', () => {
  assert.equal(registerSchema.safeParse(validRequest('a'.repeat(72))).success, true);
});

test('registration rejects passwords exceeding bcrypt 72-byte limit', () => {
  assert.equal(registerSchema.safeParse(validRequest('a'.repeat(73))).success, false);
  assert.equal(registerSchema.safeParse(validRequest('😀'.repeat(20))).success, false);
});

test('login schema still accepts a valid email and password', () => {
  const result = loginSchema.safeParse({
    body: { email: 'test@example.com', password: 'valid-password' },
    params: {},
    query: {}
  });

  assert.equal(result.success, true);
});
