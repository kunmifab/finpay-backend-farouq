const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const authRoutes = require('./routes/authRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const authenticate = require('./middlewares/authenticate');
const { startExchangeRateJob } = require('./job/exchangeRateJob');
const invoiceRoutes = require('./routes/invoiceRoutes');
const cardRoutes = require('./routes/cardRoutes');
const mapleradWebhookRoute = require('./routes/mapleradWebhookRoute');
const walletRoutes = require('./routes/walletRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const openApiSpec = require('./docs/openapi');
const { httpLogger, logger, rTracer } = require('./utils/logger');
const { createErrorHandler } = require('./middlewares/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(rTracer.expressMiddleware({ useHeader: true, headerName: 'x-request-id', echoHeader: true }));
app.use(httpLogger);
app.use('/docs', swaggerUi.serve, swaggerUi.setup(openApiSpec, { explorer: true }));
app.get('/docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(openApiSpec);
});
app.use('/webhooks/maplerad', bodyParser.raw({ type: 'application/json' }), mapleradWebhookRoute);
app.use(bodyParser.json());

app.use('/api/auth', authRoutes);
app.use('/api', authenticate, dashboardRoutes);
app.use('/api/invoices', authenticate, invoiceRoutes);
app.use('/api/transactions', authenticate, transactionRoutes);
app.use('/api/cards', authenticate, cardRoutes);
app.use('/api/wallets', authenticate, walletRoutes);

startExchangeRateJob();

app.use(createErrorHandler());

app.listen(PORT, () => {
    logger.info({ port: PORT }, 'Server is running');
});
