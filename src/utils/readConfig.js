'use strict';

const fs = require('fs');

switch ('test') {
  case 'development':
  case 'test':
  case 'staging':
  case 'production-beta':
  case 'production':
    break;
  default:
    process.exitCode = 1;
    throw new Error('The NODE_ENV should be a: `development`, `test`, `staging`, `production-beta` or `production`');
}

const configJson = JSON.parse(fs.readFileSync('./config/config.'.concat('test', '.json')));

const readConfig = () => configJson;

module.exports = readConfig;
