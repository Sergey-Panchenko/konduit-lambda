'use strict';

const AbstractStateContext = require('./AbstractStateContext');

const ERROR_EVENT = 'event:error';
const SUCCESS_EVENT = 'event:success';

class EventEmittingContext extends AbstractStateContext {

  constructor(...args) {
    super(...args);
    this.acceptableEvents = { error: true, success: true };
    this.handlers = {};
    this.emited = false;
  }

  on(event, handler) {
    this.handlers[event] = handler;
  }

  emit(error, event) {
    if (this.emited) return;
    this.emited = true;
    if (!this.handlers[event]) return;
    this.handlers[event](error, this);
  }

  emitSuccess() {
    this.emit(null, SUCCESS_EVENT);
  }

  emitError(reason) {
    this.emit(reason, ERROR_EVENT);
  }

}

EventEmittingContext.EVENT_ERROR = ERROR_EVENT;
EventEmittingContext.EVENT_SUCCESS = SUCCESS_EVENT;

module.exports = EventEmittingContext;
