const bcrypt = require('bcryptjs');

jest.mock('../../src/utils/mailers', () => ({
  sendEmail: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../src/utils/templateEngine', () => ({
  renderTemplate: jest.fn(() => '<html></html>'),
}));

const appRequest = require('./helpers/app');
const { prisma, resetDatabase, createJwt, createUser } = require('./helpers/prismaTestClient');
const { sendEmail } = require('../../src/utils/mailers');
const { renderTemplate } = require('../../src/utils/templateEngine');

const AUTH_HEADER = 'x-auth-token';

describe('Auth integration flows', () => {
  beforeEach(async () => {
    await resetDatabase();
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('POST /api/auth/login', () => {
    it('returns token for valid credentials', async () => {
      const password = 'Password123!';
      const hashed = await bcrypt.hash(password, 10);
      await createUser({ email: 'login@example.com', password: hashed });

      const response = await appRequest()
        .post('/api/auth/login')
        .send({ email: 'login@example.com', password });

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
    });

    it('rejects invalid password', async () => {
      const hashed = await bcrypt.hash('Password123!', 10);
      await createUser({ email: 'invalid@example.com', password: hashed });

      const response = await appRequest()
        .post('/api/auth/login')
        .send({ email: 'invalid@example.com', password: 'WrongPass' });

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('allows an authenticated user to logout', async () => {
      const hashed = await bcrypt.hash('Password123!', 10);
      const user = await createUser({ email: 'logout@example.com', password: hashed });

      const loginRes = await appRequest()
        .post('/api/auth/login')
        .send({ email: 'logout@example.com', password: 'Password123!' });

      const token = loginRes.body.data.token;

      const response = await appRequest()
        .post('/api/auth/logout')
        .set(AUTH_HEADER, token)
        .send();

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('POST /api/auth/verify-email', () => {
    it('verifies a user when code matches', async () => {
      const user = await createUser({
        verify_email: 0,
        verify_email_code: 4321,
      });
      const token = createJwt(user);

      const response = await appRequest()
        .post('/api/auth/verify-email')
        .set(AUTH_HEADER, token)
        .send({ code: 4321 });

      expect(response.statusCode).toBe(200);
      const updated = await prisma.user.findUnique({ where: { id: user.id } });
      expect(updated.verify_email).toBe(1);
    });

    it('returns 400 for mismatched codes', async () => {
      const user = await createUser({ verify_email: 0, verify_email_code: 1111 });
      const token = createJwt(user);

      const response = await appRequest()
        .post('/api/auth/verify-email')
        .set(AUTH_HEADER, token)
        .send({ code: 2222 });

      expect(response.statusCode).toBe(400);
      expect(response.body.message).toMatch(/invalid code/i);
    });
  });

  describe('POST /api/auth/password/reset', () => {
    it('updates password when old password matches', async () => {
      const hashed = await bcrypt.hash('OldPass123!', 10);
      await createUser({ email: 'reset@example.com', password: hashed });

      const response = await appRequest()
        .post('/api/auth/password/reset')
        .send({
          email: 'reset@example.com',
          old_password: 'OldPass123!',
          new_password: 'NewPass456!',
        });

      expect(response.statusCode).toBe(200);

      const user = await prisma.user.findUnique({ where: { email: 'reset@example.com' } });
      const matchesNew = await bcrypt.compare('NewPass456!', user.password);
      expect(matchesNew).toBe(true);
    });
  });

  describe('POST /api/auth/send-verify-email', () => {
    it('sends verification email for unverified user', async () => {
      const user = await createUser({ verify_email: 0, verify_email_code: null });
      const token = createJwt(user);

      const response = await appRequest()
        .post('/api/auth/send-verify-email')
        .set(AUTH_HEADER, token)
        .send();

      expect(response.statusCode).toBe(200);
      expect(sendEmail).toHaveBeenCalled();
      expect(renderTemplate).toHaveBeenCalled();
    });
  });
});
