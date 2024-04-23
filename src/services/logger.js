'use strict';

const util = require('util'); // eslint-disable-line
const winston = require('winston');
const logstashTransports = require('winston-logstash');
const getConfigParameter = require('../utils/getConfigParameter');
const httpLoader = require('./httpLoader');
const instanceMetaDataApi = require('../constants/instanceMetaDataApi');


const instanceMetaData = {
  localHostname: null,
  reservationId: null,
};

const loggerTransports = [];

if (getConfigParameter('NODE_ENV') !== 'test') {
  if (getConfigParameter('LOG_FILE')) {
    loggerTransports.push(
      new (winston.transports.File)({filename: getConfigParameter('LOG_FILE')})// eslint-disable-line
    );
  }

  if (getConfigParameter('LOGSTASH_HOST') && getConfigParameter('LOGSTASH_PORT')) {
    loggerTransports.push(
      new (logstashTransports.Logstash)({// eslint-disable-line
        host: getConfigParameter('LOGSTASH_HOST'),
        port: getConfigParameter('LOGSTASH_PORT'),
        level: getConfigParameter('LOG_LEVEL'),
        max_connect_retries: 1,
        node_name: 'kme-proxy',
      })
    );
  }
}

// vlad.dotsenko @note: enable pure console output for development server
if (['development', 'test'].includes(getConfigParameter('NODE_ENV'))) {
  const consoleTransportProvider = require('winston-console-formatter'); // eslint-disable-line
  const transportConfig = consoleTransportProvider.config();
  transportConfig.level = 'warn';
  loggerTransports.push(new (winston.transports.Console)(transportConfig));
}

// TODO: Logger logic from AbstractState#_prepareOptimizedLogMeta should be moved in here
// TODO: Note that context will be required as a logger parameter
/**
 * @type {Logger}
 */
const logger = new (winston.Logger)({
  transports: loggerTransports,
});
/* eslint-disable no-param-reassign */
logger.rewriters.push((level, msg, meta) => {
  meta = meta || {};

  if (instanceMetaData.localHostname) {
    meta.localHostname = instanceMetaData.localHostname;
  }

  if (meta.data && Object.keys(meta.data).length) {
    meta.data = util.inspect(meta.data);
  }

  return meta;
});

const testingErrorProcessing = (error) => {
  throw error;
};

const defaultErrorProcessing = (error) => {
  logger.error('Uncaught Exception', error);
};

let actualErrorProcessingStrategy = defaultErrorProcessing;
if (getConfigParameter('NODE_ENV') === 'test') {
  actualErrorProcessingStrategy = testingErrorProcessing;
}

process.on('uncaughtException', actualErrorProcessingStrategy);

process.on('unhandledRejection', actualErrorProcessingStrategy);

if (getConfigParameter('NODE_ENV') !== 'test') {
  httpLoader(instanceMetaDataApi.localHostname).then((localHostname) => {
    instanceMetaData.localHostname = localHostname;
  }, (err) => {
    logger.error(`Error receive \`local-hostname\` from: ${instanceMetaDataApi.localHostname}`, {
      data: util.inspect(err, false, null),
    });
  });

  httpLoader(instanceMetaDataApi.reservationId).then((reservationId) => {
    instanceMetaData.reservationId = reservationId;
  }, (err) => {
    logger.error(`Error receive \`reservation-id\` from: ${instanceMetaDataApi.reservationId}`, {
      data: util.inspect(err, false, null),
    });
  });
}
/* eslint-enable no-param-reassign */

module.exports = logger;
