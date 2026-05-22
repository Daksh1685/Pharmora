
const logLevels = {
  ERROR: 'ERROR',
  WARN: 'WARN',
  INFO: 'INFO',
  DEBUG: 'DEBUG',
};

const getTimestamp = () => {
  return new Date().toISOString();
};

const logger = {
  error: (message, error = '') => {
    console.error(`[${getTimestamp()}] [${logLevels.ERROR}] ${message}`, error);
  },

  warn: (message, data = '') => {
    console.warn(`[${getTimestamp()}] [${logLevels.WARN}] ${message}`, data);
  },

  info: (message, data = '') => {
    console.log(`[${getTimestamp()}] [${logLevels.INFO}] ${message}`, data);
  },

  debug: (message, data = '') => {
    if (process.env.LOG_LEVEL === 'debug') {
      console.log(`[${getTimestamp()}] [${logLevels.DEBUG}] ${message}`, data);
    }
  },
};

module.exports = logger;
