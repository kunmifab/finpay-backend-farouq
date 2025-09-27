const path = require('path');
const pino = require('pino');
const pinoHttp = require('pino-http');
const rTracer = require('cls-rtracer');
const { randomUUID } = require('crypto');

const level = process.env.LOG_LEVEL || 'info';
const prettyEnabled = process.env.LOG_PRETTY === 'true' || process.env.NODE_ENV === 'development';
const logFilePath = process.env.LOG_FILE_PATH === 'false'
  ? null
  : process.env.LOG_FILE_PATH || path.resolve(__dirname, '../../logs/app.log');

const transportTargets = [];

if (prettyEnabled) {
  transportTargets.push({
    target: 'pino-pretty',
    level,
    options: {
      destination: 1,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname'
    }
  });
} else {
  transportTargets.push({
    target: 'pino/file',
    level,
    options: {
      destination: 1
    }
  });
}

if (logFilePath) {
  transportTargets.push({
    target: 'pino/file',
    level,
    options: {
      destination: logFilePath,
      mkdir: true
    }
  });
}

const transport = { targets: transportTargets };

const logger = pino({
  level,
  transport,
  redact: {
    paths: ['req.headers.authorization', 'password', '*.password'],
    remove: true
  }
});

const httpLogger = pinoHttp({
  logger,
  autoLogging: true,
  genReqId(req) {
    if (req.id) {
      return req.id;
    }
    const existing = req.headers['x-request-id'];
    const id = existing || randomUUID();
    req.id = id;
    return id;
  },
  customProps(req) {
    return {
      service: 'finpay-backend',
      requestId: req.id
    };
  },
  serializers: {
    req(req) {
      return {
        method: req.method,
        url: req.url,
        id: req.id,
        remoteAddress: req.remoteAddress,
        userAgent: req.headers['user-agent']
      };
    },
    res(res) {
      return {
        statusCode: res.statusCode
      };
    }
  }
});

const getChildLogger = (bindings = {}) => logger.child(bindings);
const getRequestLogger = (bindings = {}) => {
  const requestId = rTracer.id();
  return logger.child({ requestId, ...bindings });
};

module.exports = {
  logger,
  httpLogger,
  getChildLogger,
  getRequestLogger,
  rTracer
};
