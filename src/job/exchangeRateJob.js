const cron = require('node-cron');
const db = require('../utils/db/prisma');
const { getChildLogger } = require('../utils/logger');

try { require('dotenv').config(); } catch {}

const API_KEY = process.env.EXCHANGE_RATE_API_KEY;
const log = getChildLogger({ module: 'exchange-rate-job' });

async function fetchAndStoreExchangeRate() {
    log.info('Fetching and storing latest exchange rates');
    const baseCurrency = 'USD';

    if (!API_KEY) {
        log.error('EXCHANGE_RATE_API_KEY is not set');
        return;
    }

    try {
        const url = `https://v6.exchangerate-api.com/v6/${API_KEY}/latest/${baseCurrency}`;
        const response = await fetch(url);

        if (!response.ok) {
            const errText = await response.text().catch(() => '');
            throw new Error(`HTTP ${response.status}: ${errText || 'fetch failed'}`);
        }

        const data = await response.json();

        if (data.result === 'success') {
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

            log.info('Exchange rates fetched and stored successfully');
        } else {
            log.warn({ error: data['error-type'] || data }, 'Exchange rate provider returned error response');
        }

    } catch (error) {
        log.error({ err: error }, 'Error fetching exchange rates');
    }
}

const startExchangeRateJob = () => {
    cron.schedule('0 * * * *', () => {
        fetchAndStoreExchangeRate();
    });
    log.info('Exchange rate scheduler started. It will run every hour.');
};

module.exports = {
    startExchangeRateJob,
    fetchAndStoreExchangeRate,
};
