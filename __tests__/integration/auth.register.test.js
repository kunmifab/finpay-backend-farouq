jest.mock('../../src/utils/mailers', () => ({
  sendEmail: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../src/utils/templateEngine', () => ({
  renderTemplate: jest.fn(() => '<html></html>'),
}));

jest.mock('../../src/job/queues', () => ({
  postSignupQueue: {
    add: jest.fn().mockResolvedValue(undefined),
  },
}));

const appRequest = require('./helpers/app');
const { prisma, resetDatabase } = require('./helpers/prismaTestClient');
const { sendEmail } = require('../../src/utils/mailers');
const { renderTemplate } = require('../../src/utils/templateEngine');
const { postSignupQueue } = require('../../src/job/queues');

describe('Auth Integration - POST /api/auth/register', () => {
  beforeEach(async () => {
    await resetDatabase();
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('registers a new user and enqueues post-signup job', async () => {
    const payload = {
      email: 'newuser@example.com',
      password: 'Password123!',
      name: 'New User',
      phoneNumber: '1234567890',
      accountType: 'Freelancer',
    };

    const response = await appRequest()
      .post('/api/auth/register')
      .send(payload)
      .set('Content-Type', 'application/json');

    expect(response.statusCode).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.token).toBeDefined();

    const user = await prisma.user.findUnique({ where: { email: payload.email } });
    expect(user).not.toBeNull();

    expect(sendEmail).toHaveBeenCalled();
    expect(renderTemplate).toHaveBeenCalled();
    expect(postSignupQueue.add).toHaveBeenCalledWith('post-signup', expect.objectContaining({ userId: user.id }));
  });

  it('rejects duplicate email registration', async () => {
    await prisma.user.create({
      data: {
        email: 'duplicate@example.com',
        password: 'hash',
        name: 'Existing',
        phoneNumber: '0000000000',
      },
    });

    const response = await appRequest()
      .post('/api/auth/register')
      .send({
        email: 'duplicate@example.com',
        password: 'Password123!',
        name: 'Dup User',
        phoneNumber: '9999999999',
      });

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toMatch(/already exists/i);
  });
});


