const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');

const app = require('./app');

test('health endpoint responds through the HTTP app', async () => {
  const response = await request(app).get('/api/v1/health');

  assert.equal(response.status, 200);
  assert.equal(response.body.success, true);
});

test('protected routes reject requests without a token', async () => {
  const response = await request(app).get('/api/v1/usuarios');

  assert.equal(response.status, 401);
  assert.equal(response.body.success, false);
});

test('login limiter blocks the eleventh request from one client', async () => {
  const responses = await Promise.all(
    Array.from({ length: 11 }, () => request(app)
      .post('/api/v1/auth/login')
      .send({ email: '', senha: '' }))
  );

  assert.equal(responses.at(-1).status, 429);
});
