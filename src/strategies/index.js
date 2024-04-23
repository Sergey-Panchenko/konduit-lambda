'use strict';

const clientWoVpaidWrappingStrategy = require('./implementations/clientWoVpaidWrappingStrategy');
const clientWoAdVerificationStrategy = require('./implementations/clientWoAdVerificationStrategy');
const vastWrappingStrategy = require('./implementations/vastWrappingStrategy');

module.exports = {
  clientWoVpaidWrappingStrategy,
  clientWoAdVerificationStrategy,
  vastWrappingStrategy,
  initialStrategies: [
  ],
};
