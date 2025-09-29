const db = require('../../utils/db/prisma');
const { getChildLogger } = require('../../utils/logger');

try { require('dotenv').config(); } catch {}

const API_KEY = process.env.EXCHANGE_RATE_API_KEY;
const baseCurrency = 'USD';
const log = getChildLogger({ module: 'exchange-rate-task' });

const runExchangeRateSync = async () => {
    log.info('Fetching and storing latest exchange rates');

    if (!API_KEY) {
        log.error('EXCHANGE_RATE_API_KEY is not set');
        throw new Error('EXCHANGE_RATE_API_KEY is not set');
    }

    const url = `https://v6.exchangerate-api.com/v6/${API_KEY}/latest/${baseCurrency}`;

    const response = await fetch(url);

    if (!response.ok) {
        const errText = await response.text().catch(() => '');
        throw new Error(`HTTP ${response.status}: ${errText || 'fetch failed'}`);
    }

    const data = await response.json();

    if (data.result !== 'success') {
        log.warn({ data }, 'Exchange rate provider returned non-success result');
        throw new Error(data['error-type'] || 'Exchange rate provider error');
    }

    const exchangeRates = data.conversion_rates || {};
    const gbpRate = exchangeRates.GBP;
    const eurRate = exchangeRates.EUR;
    const ngnRate = exchangeRates.NGN;
    const cadRate = exchangeRates.CAD;

    const effectiveAt = data.time_last_update_utc
        ? new Date(data.time_last_update_utc)
        : new Date();

    await db.exchangeRate.upsert({
        where: {
            base: baseCurrency,
        },
        update: {
            gbp: gbpRate != null ? String(gbpRate) : null,
            eur: eurRate != null ? String(eurRate) : null,
            ngn: ngnRate != null ? String(ngnRate) : null,
            cad: cadRate != null ? String(cadRate) : null,
            effectiveAt,
        },
        create: {
            base: baseCurrency,
            gbp: gbpRate != null ? String(gbpRate) : null,
            eur: eurRate != null ? String(eurRate) : null,
            ngn: ngnRate != null ? String(ngnRate) : null,
            cad: cadRate != null ? String(cadRate) : null,
            effectiveAt,
            provider: 'exchangerate-api',
        },
    });

    log.info('Exchange rates updated');
};

module.exports = {
    runExchangeRateSync,
};
