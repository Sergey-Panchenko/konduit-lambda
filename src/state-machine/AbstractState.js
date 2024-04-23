'use strict';

const util = require('util');

const getTimestamp = require('../utils/getTimestamp');
const hrtimeToMs = require('../utils/hrtimeToMs');


class AbstractState {

  constructor(name) {
    this.name = name;
    if (!AbstractState.LOGGER) {
      throw Error('Please configure logger before use');
    }
  }

  run(context) {
    this._context = context;
    this.onEnterState();
  }

  getContext() {
    return this._context;
  }

  onEnterState() {
    this.startTimestamp = getTimestamp();

    this._logDebug(`on enter state: ${this.name}`, {
      command: `onEnterState.${this.name}`,
    });
  }

  onExitState() {
    this.endTimestamp = getTimestamp();
    this.elapsedTime = this.endTimestamp - this.startTimestamp;

    this._logDebug(`on exit state: ${this.name}`, {
      command: `onExitState.${this.name}`,
      elapsedTime: this.elapsedTime,
    });

    this._context = null;
  }

  // @TODO: Move the log logic to a separate class
  _logDebug(message, meta) {
    const context = this.getContext();
    if (!context.allowLogs) return;

    AbstractState.LOGGER.debug(message, this._prepareOptimizedLogMeta(meta));
  }

  _logInfo(message, meta) {
    const context = this.getContext();
    if (!context.allowLogs) return;

    AbstractState.LOGGER.info(message, this._prepareOptimizedLogMeta(meta));
  }

  _logWarning(message, meta) {
    AbstractState.LOGGER.warn(message, this._prepareOptimizedLogMeta(meta));
  }

  _logError(message, meta) {
    AbstractState.LOGGER.error(message, this._preprocessErrorMeta(meta));
  }

  _preprocessErrorMeta(meta) {
    let logMeta = this._prepareLogMeta(meta);
    if (this._context && !this._context.allowLogs) {
      this._context.allowLogs = true;
      logMeta = this._enrichLogMetaWithBody(logMeta);
    }

    return logMeta;
  }

  _enrichLogMetaWithBody(meta) {
    const newMeta = meta || {};

    if (!newMeta.body && this._context.currentTextResult) {
      newMeta.body = this._context.currentTextResult;
    }

    return newMeta;
  }

  _prepareOptimizedLogMeta(meta) {
    let logMeta = this._prepareLogMeta(meta);
    if (this._context && !this._context.allowLogs) {
      logMeta = AbstractState.minimizeLogMeta(logMeta);
    }

    return logMeta;
  }

  static minimizeLogMeta(meta) {
    const newMeta = meta || {};

    const cleanupFieldNames = ['body', 'rawHeaders'];
    cleanupFieldNames.forEach((fieldName) => {
      if (fieldName in meta) {
        delete newMeta[fieldName];
      }
    });

    return newMeta;
  }

  _prepareLogMeta(meta) {
    const newMeta = meta || {};

    const context = this._context || {};

    newMeta.requestId = context.kid;
    newMeta.konduitId = context.clientId;
    newMeta.completeLogRecord = context.allowLogs;

    // @todo: temporary solution to track adPosition in logs (case of multiple ADs per adpod)
    if (context.isInternalProcessor) {
      newMeta.adPosition = parseInt(context.adPosition, 10);
    }
    if (newMeta.state) {
      newMeta.command = `${this.name}.${newMeta.state}`;
      delete newMeta.state;
    }

    if (newMeta.error && newMeta.error instanceof Error) {
      newMeta.error = util.inspect(newMeta.error);
    }

    if (context.startTime) {
      newMeta.elapsedTimeMS = hrtimeToMs(process.hrtime(context.startTime));

      newMeta.processingTime = context.lastTime ?
        hrtimeToMs(process.hrtime(context.lastTime)) :
        newMeta.elapsedTimeMS;

      context.lastTime = process.hrtime();
    }

    if (context.clientSpecificLogFields) {
      Object.keys(context.clientSpecificLogFields)
        .forEach((logFieldName) => {
          newMeta[logFieldName] = context.clientSpecificLogFields[logFieldName];
        });
    }
    // newMeta.initialVastUrl = this._context.initialVastUrl;
    // newMeta.currentVastUrl = this._context.currentVastUrl;

    return newMeta;
  }

  destroy() {// eslint-disable-line
    // @abstract
  }

}

module.exports = AbstractState;
