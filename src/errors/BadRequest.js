'use strict';

const BaseError = require('./BaseError');

class BadRequestError extends BaseError {
  constructor(message) {
    super(message);
    this.status = 400;
  }
}

module.exports = BadRequestError;
