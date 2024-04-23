'use strict';

const HandlerReport = require('./HandlerReport');

/**
 * Abstract Strategy class
 *
 * Abstraction for an algorithm that handles VastContext somehow
 * Determines handling and tracking logic separately
 * Results with strict report model
 * Performs actuality check to ensure it really can handle specific tag.
 * Reusable on multiple contexts, single unique strategy instance per system is enough
 *
 * Instantiate a strategy to implement algorithm.
 */

class Strategy {

  /**
   * @param  {Function} options.isActual    -- function to check if this strategy is actual for specific context
   * @param  {Function} options.handler     -- main strategy algorithm implementation
   * @param  {Function} options.tracking    -- handling result tracking implementation
   */
  constructor({ isActual = null, handler, tracking = null }) {
    if (isActual !== null && !(isActual instanceof Function)) {
      throw new TypeError('Strategy constructor expects `isActual` property to be null or Function');
    }
    this.actionChecker = isActual;

    if (!(handler instanceof Function)) {
      throw new TypeError('Strategy constructor expects `handler` property to be a Function');
    }
    this.handler = handler;

    if (tracking !== null && !(tracking instanceof Function)) {
      throw new TypeError('Strategy constructor expects `tracking` property to be null or Function');
    }
    this.tracking = tracking;
  }

  /**
   * Checks if current strategy is actual for specified context.
   * Delegates to `isActual` constructor property
   *
   * @param  {VastContext}    context       -- context to check against
   *
   * @return {Boolean}
   */
  isActualForContext(context) {
    if (!this.actionChecker) return true;

    return !!this.actionChecker(context);
  }

  /**
   * Forces strategy appliance against context
   * Delegates to `handler` constructor property
   *
   * @param  {VastContext}    context       -- context to process
   *
   * @return {HandlerReport}                -- handling operation report
   */
  applyForContext(context) {
    return this.handler(context);
  }

  /**
   * Encapsulates tracking of handling result.
   * Specific logger should be passed here.
   * Delegates to `tracking` constructor property
   *
   * @param  {HandlerReport}  handlerReport -- report of handling process to track
   * @param  {Logger}         logger        -- logger that will be passed to tracking handler
   *
   * @return {HandlerReport}                -- bypassed handling report
   */
  track(handlerReport, logger) {
    if (this.tracking !== null) {
      this.tracking(handlerReport, logger);
    }

    return handlerReport;
  }

  /**
   * Full strategy handling chain.
   * 1. Check if strategy is actual for context, abort if not.
   * 2. Apply strategy to current context
   * 3. Track handling report with specified tracking function and logger
   *
   * @param  {VastContext}    context       -- context to process
   * @param  {Logger}         logger        -- logger that will be passed to tracking handler
   *
   * @return {HandlerReport}                -- bypassed handling report
   */
  handle(context, logger) {
    if (!this.isActualForContext(context)) {
      return HandlerReport.makeFailed(null);
    }

    const handlerReport = this.applyForContext(context);
    this.track(handlerReport, logger);
    return handlerReport;
  }

}

module.exports = Strategy;
