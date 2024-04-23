'use strict';

class HandlerReport {

  static makeSuccessful(details) {
    return new this(true, details);
  }

  static makeFailed(details) {
    return new this(false, details);
  }

  constructor(isSuccessful, details) {
    this.isSuccessful = !!isSuccessful;
    this.details = details;
  }

  getTextualStatus() {
    return this.isSuccessful ? 'succeed' : 'failed';
  }

}

module.exports = HandlerReport;
