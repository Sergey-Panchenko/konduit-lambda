'use strict';

const BaseError = require('./BaseError');

class AdUnitProcessingError extends BaseError {
  constructor(message, adUnitContext) {
    super(message);
    this.adUnitContext = adUnitContext;
    this.adUnitContext.optimizationsChain = [];
    this.reason = message;
  }
}

module.exports = AdUnitProcessingError;
