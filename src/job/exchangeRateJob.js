const cron = require('node-cron');
const db = require('../utils/db/prisma');

try { require('dotenv').config(); } catch {}

const API_KEY = process.env.EXCHANGE_RATE_API_KEY;

async function fetchAndStoreExchangeRate() {
    console.log('Fetching and storing latest exchange rates...');
    const baseCurrency = 'USD';

    if (!API_KEY) {
        console.error('EXCHANGE_RATE_API_KEY is not set');
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

            // provider timestamp (v6 returns time_last_update_utc)
            const effectiveAt = data.time_last_update_utc
                ? new Date(data.time_last_update_utc)
                : new Date();

            // Use `upsert` to either create or update the record.
            const exchangeRate = await db.exchangeRate.upsert({
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

            console.log('Exchange rates fetched and stored successfully');
        } else {
            console.log('Error fetching exchange rates:', data['error-type'] || data);
        }

    } catch (error) {
        console.error('Error fetching exchange rates:', error);
    }
}

const startExchangeRateJob = () => {
    cron.schedule('0 * * * *', () => {
        fetchAndStoreExchangeRate();
    });
    console.log('Exchange rate scheduler started. It will run every hour.');
};

module.exports = {
    startExchangeRateJob,
    fetchAndStoreExchangeRate,
};
