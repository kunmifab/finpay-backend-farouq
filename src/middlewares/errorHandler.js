const { getRequestLogger, rTracer } = require('../utils/logger');

const mapErrorToResponse = (err) => {
  if (err.name === 'ValidationError') {
    return {
      status: 400,
      body: {
        message: err.message || 'Validation failed',
        success: false,
        status: 400,
        details: err.details || undefined
      }
    };
  }

  if (err.statusCode && err.message) {
    return {
      status: err.statusCode,
      body: {
        message: err.message,
        success: false,
        status: err.statusCode
      }
    };
  }

  return {
    status: 500,
    body: {
      message: 'Internal server error',
      success: false,
      status: 500,
      requestId: rTracer.id()
    }
  };
};

const createErrorHandler = () => {
  return (err, req, res, next) => { // eslint-disable-line no-unused-vars
    const requestLogger = getRequestLogger({ module: 'error-handler' });
    requestLogger.error({ err }, 'Unhandled error encountered');

    const { status, body } = mapErrorToResponse(err);
    res.status(status).json(body);
  };
};

module.exports = {
  createErrorHandler
};
