jest.mock('../../../src/utils/db/prisma', () => ({
  exchangeRate: {
    findUnique: jest.fn(),
  },
  balance: {
    findMany: jest.fn(),
  },
}));

const db = require('../../../src/utils/db/prisma');
const { totalBalance } = require('../../../src/utils/totalBalance');

describe('totalBalance', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns null when exchange rate is missing', async () => {
    db.exchangeRate.findUnique.mockResolvedValue(null);

    const result = await totalBalance('user-1');

    expect(result).toBeNull();
    expect(db.exchangeRate.findUnique).toHaveBeenCalledWith({ where: { base: 'USD' } });
  });

  it('returns 0 when user has no balances', async () => {
    db.exchangeRate.findUnique.mockResolvedValue({ usd: 1 });
    db.balance.findMany.mockResolvedValue([]);

    const result = await totalBalance('user-1');

    expect(result).toBe(0);
    expect(db.balance.findMany).toHaveBeenCalledWith({
      where: {
        userId: 'user-1',
        amount: { not: 0 },
      },
    });
  });

  it('converts balances using exchange rates and returns total USD amount', async () => {
    db.exchangeRate.findUnique.mockResolvedValue({
      usd: 1,
      ngn: 800,
      eur: 0.9,
    });

    db.balance.findMany.mockResolvedValue([
      { currency: 'USD', amount: 100 },
      { currency: 'NGN', amount: 8000 },
      { currency: 'EUR', amount: 18 },
    ]);

    const result = await totalBalance('user-2');

    expect(result).toBeCloseTo(130, 2);
  });
});
