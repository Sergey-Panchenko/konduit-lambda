'use strict';

const readConfig = require('./readConfig');
const { toString, toBoolean, toInteger, toFloat } = require('./valueConverters');

/* eslint-disable max-lines-per-function, complexity */
function getConfigParameter(paramName) {
  if (paramName === 'NODE_ENV') {
    return 'test';
  }
  const value = process.env[paramName] || readConfig()[paramName];
  if (value === undefined) {
    /**
     * @TODO skip `undefined`:
     * 'LOGSTASH_HOST_@'
     * 'LOGSTASH_PORT_@'
     */
    return value;// eslint-disable-line
  }

  let formatter;

  switch (paramName) {
    case 'VAST_REQUEST_TIMEOUT':
    case 'VAST_RESPONSE_COMPRESSION_LEVEL':
    case 'KONDUIT_PORT':
    case 'LOGSTASH_PORT':
    case 'VAST_WRAPPER_NESTING_LIMIT':
    case 'ADPOD_NUMBER_OF_ADS_TO_PROCESS':
    case 'CLIENT_WO_ENFORCE_WRAPPER_FILTERING_VALUE':
      formatter = toInteger;
      break;

    case 'AB_TESTING_ENABLED':
      formatter = toBoolean;
      break;

    case 'LOG_RATE':
    case 'CONTROL_GROUP_WRAPPER_SIZE':
      formatter = toFloat;
      break;

    case 'TRACKING_BROWSERS':
    case 'LOGSTASH_HOST':
    case 'KONDUIT_WHITELABEL':
    case 'LOG_FILE':
    case 'PIXEL_TRACKER_EVENT_URL':
    case 'PIXEL_TRACKER_ERROR_URL':
    case 'VAST_SCHEMA':
    case 'VPAID_WRAPPER_URL':
    default:
      formatter = toString;
      break;
  }

  return formatter(value);// eslint-disable-line
}

module.exports = getConfigParameter;
