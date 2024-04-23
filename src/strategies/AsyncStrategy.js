'use strict';

const Strategy = require('./Strategy');
const HandlerReport = require('./HandlerReport');

/**
 * Abstract Asynchronous Strategy class
 *
 * Same as simple Strategy, but carefully wraps all handlers with Promise
 * All methods results with Promise.
 * Ensures all runtime errors (except constructing TypeErrors) would be exposed as Promise rejection.
 */

// @TODO: add unit tests
class AsyncStrategy extends Strategy {

  static fromSyncStrategy(strategy) {
    if (!(strategy instanceof Strategy)) {
      throw new TypeError('Expecting Strategy instance as a parameter');
    }

    return new this({
      isActual: strategy.actionChecker,
      handler: strategy.handler,
      tracking: strategy.tracking,
    });
  }

  // @TODO: update this to wait for function execution
  isActualForContext(context) {
    const defer = super.isActualForContext(context);
    return (defer instanceof Promise) ? defer : Promise.resolve(defer);
  }

  // @TODO: update this to wait for function execution
  applyForContext(context) {
    const defer = super.applyForContext(context);
    return (defer instanceof Promise) ? defer : Promise.resolve(defer);
  }

  // @TODO: update this to wait for function execution
  track(handlerReport, logger) {
    const defer = super.track(handlerReport, logger);
    return (defer instanceof Promise) ? defer : Promise.resolve(defer);
  }

  handle(context, logger) {
    return this.isActualForContext(context)
      .then((isActual) => {
        if (!isActual) return HandlerReport.makeFailed(null);

        return this.applyForContext(context)
          .then(handlerReport => this.track(handlerReport, logger));
      });
  }

}

module.exports = AsyncStrategy;
