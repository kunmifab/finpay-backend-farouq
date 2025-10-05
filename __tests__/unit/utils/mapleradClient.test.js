const MockAdapter = require('axios-mock-adapter');

describe('mapleradAxios', () => {
  let mapleradAxios;
  let mock;

  beforeEach(() => {
    jest.resetModules();
    process.env.MAPLERAD_SECRET_KEY = 'test-key';
    ({ mapleradAxios } = require('../../../src/utils/mapleradClient'));
    mock = new MockAdapter(mapleradAxios);
  });

  afterEach(() => {
    mock.reset();
    delete process.env.MAPLERAD_SECRET_KEY;
  });

  it('attaches bearer authorization header on every request', async () => {
    expect.assertions(2);

    mock.onGet('/ping').reply((config) => {
      expect(config.headers.Authorization).toBe('Bearer test-key');
      return [200, { ok: true }];
    });

    const response = await mapleradAxios.get('/ping');
    expect(response.data).toEqual({ ok: true });
  });

  it('wraps provider error responses with status and message', async () => {
    mock.onPost('/cards').reply(400, { message: 'could not process request' });

    await expect(mapleradAxios.post('/cards', {})).rejects.toMatchObject({
      message: '[Maplerad] could not process request',
      status: 400,
      data: { message: 'could not process request' },
    });
  });
});
