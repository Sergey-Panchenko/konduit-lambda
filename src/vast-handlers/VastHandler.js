'use strict';

const extractRequiredFields = require('../utils/log/extractRequiredFields');

class VastHandler {

  constructor(context, logger) {
    this.context = context;
    this.logger = logger;
    this.completeLogRecord = context.allowLogs;
    this.initialized = false;
  }

  enrichLogBody(body) {
    const mandatoryFields = extractRequiredFields(this.context);
    return Object.assign({}, mandatoryFields, body, { caller: this.constructor.name });
  }

  logError(message, body) {
    if (!this.logger) return;
    const extendedBody = this.enrichLogBody(body);
    this.logger.error(message, extendedBody);
  }

  logInfo(message, body) {
    if (!this.logger || !this.completeLogRecord) return;
    const extendedBody = this.enrichLogBody(body);
    this.logger.info(message, extendedBody);
  }

  logWarning(message, body) {
    if (!this.logger) return;
    const extendedBody = this.enrichLogBody(body);
    this.logger.warn(message, extendedBody);
  }

  logDebug(message, body) {
    if (!this.logger || !this.completeLogRecord) return;
    const extendedBody = this.enrichLogBody(body);
    this.logger.debug(message, extendedBody);
  }
}

module.exports = VastHandler;
