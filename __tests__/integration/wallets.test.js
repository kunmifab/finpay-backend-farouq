jest.mock('../../src/services/maplerad/transactions', () => ({
  transferMoney: jest.fn(),
  creditTestWallet: jest.fn(),
  convertCurrency: jest.fn(),
}));

const { transferMoney, creditTestWallet, convertCurrency } = require('../../src/services/maplerad/transactions');
const appRequest = require('./helpers/app');
const { prisma, resetDatabase, createUser, createJwt } = require('./helpers/prismaTestClient');

const AUTH_HEADER = 'x-auth-token';

describe('Wallet integration', () => {
  beforeEach(async () => {
    await resetDatabase();
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('retrieves balance for currency', async () => {
    const user = await createUser();
    await prisma.balance.create({
      data: { userId: user.id, currency: 'USD', amount: 150 },
    });

    const token = createJwt(user);

    const response = await appRequest()
      .get('/api/wallets/balance')
      .set(AUTH_HEADER, token)
      .query({ currency: 'USD' });

    expect(response.statusCode).toBe(201);
    expect(response.body.data).toEqual({ balance: 150, currency: 'USD' });
  });

  it('funds wallet via Maplerad credit', async () => {
    creditTestWallet.mockResolvedValue({ data: { id: 'fund-1' } });

    const user = await createUser();
    await prisma.balance.create({ data: { userId: user.id, currency: 'USD', amount: 10 } });

    const token = createJwt(user);

    const response = await appRequest()
      .post('/api/wallets/fund')
      .set(AUTH_HEADER, token)
      .send({ amount: 40, currency: 'USD' });

    expect(response.statusCode).toBe(201);
    const balance = await prisma.balance.findFirst({ where: { userId: user.id, currency: 'USD' } });
    expect(balance.amount).toBeCloseTo(50);
    expect(creditTestWallet).toHaveBeenCalledWith({ amount: 4000, currency: 'USD' });
  });

  it('sends money to beneficiary when balance sufficient', async () => {
    transferMoney.mockResolvedValue({ id: 'tx-123' });

    const user = await createUser();
    await prisma.balance.create({ data: { userId: user.id, currency: 'USD', amount: 100 } });

    const token = createJwt(user);

    const payload = {
      accountType: 'individual',
      amount: 50,
      currency: 'USD',
      recievingCurrency: 'USD',
      accountNumber: '1234567890',
      accountHolder: 'John Doe',
      bankName: 'Test Bank',
      street: '1 Test Street',
      state: 'Lagos',
      city: 'Ikeja',
      country: 'NG',
      postalCode: '100001',
    };

    const response = await appRequest()
      .post('/api/wallets/send')
      .set(AUTH_HEADER, token)
      .send(payload);

    expect(response.statusCode).toBe(201);
    const balance = await prisma.balance.findFirst({ where: { userId: user.id, currency: 'USD' } });
    expect(balance.amount).toBeCloseTo(50);
    expect(transferMoney).toHaveBeenCalled();
  });

  it('converts currency using Maplerad quote', async () => {
    convertCurrency.mockResolvedValue({
      target: { amount: 2500 },
      rate: 2,
    });

    const user = await createUser();
    await prisma.balance.create({ data: { userId: user.id, currency: 'USD', amount: 100 } });
    await prisma.balance.create({ data: { userId: user.id, currency: 'NGN', amount: 20 } });

    const token = createJwt(user);

    const response = await appRequest()
      .post('/api/wallets/convert')
      .set(AUTH_HEADER, token)
      .send({ amount: 25, fromCurrency: 'USD', toCurrency: 'NGN' });

    expect(response.statusCode).toBe(201);
    expect(convertCurrency).toHaveBeenCalledWith({ amount: 2500, fromCurrency: 'USD', toCurrency: 'NGN' });

    const usdBalance = await prisma.balance.findFirst({ where: { userId: user.id, currency: 'USD' } });
    const ngnBalance = await prisma.balance.findFirst({ where: { userId: user.id, currency: 'NGN' } });

    expect(usdBalance.amount).toBeCloseTo(75);
    expect(ngnBalance.amount).toBeCloseTo(45);
  });
});
