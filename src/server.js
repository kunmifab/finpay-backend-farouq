const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const authenticate = require('./middlewares/authenticate');
const { startExchangeRateJob, fetchAndStoreExchangeRate } = require('./job/exchangeRateJob');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

app.use('/api/auth', authRoutes);
app.use('/api', authenticate, dashboardRoutes);

startExchangeRateJob();

// app.get('/', async (req, res) => {
//     try {
//         await fetchAndStoreExchangeRate();
//         res.status(200).json({ message: 'Exchange rate update triggered successfully.' });
//     } catch (error) {
//         res.status(500).json({ message: 'Failed to trigger exchange rate update.' });
//     }
// });

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});