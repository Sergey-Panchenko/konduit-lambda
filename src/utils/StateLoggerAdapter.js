'use strict';

class StateLoggerAdapter {
  constructor(state) {
    this.state = state;
  }

  info(message, body) {
    this.state._logInfo(message, body);
  }

  debug(message, body) {
    this.state._logDebug(message, body);
  }

  error(message, body) {
    this.state._logError(message, body);
  }

  warn(message, body) {
    this.state._logWarning(message, body);
  }
}

module.exports = StateLoggerAdapter;
