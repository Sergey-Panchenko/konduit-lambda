'use strict';

const { mapUrlToVendorName } = require('../utils/mapUrlToVendorName');
const metrics = require('../utils/metrics');
const AbstractState = require('./AbstractState');

class VASTProcessorUnwrapState extends AbstractState {

  constructor() {
    super(VASTProcessorUnwrapState.STATE_NAME);
  }

  run(context) {
    /* eslint-disable no-param-reassign */
    super.run(context);

    const wrapper = context.wrapper;
    context.currentVastUrl = wrapper.get('.//VASTAdTagURI').text();
    context.unwrapOperationsCount += 1;

    this._logInfo('Wrapper VAST tag URI', {
      state: 'WrapperFound',
      vastUrl: context.currentVastUrl,
      vastVendor: mapUrlToVendorName(context.currentVastUrl),
      nestingLevel: context.nestingLevel,
    });

    metrics.vastOptimization(context, { type: 'one-level-unwrap' });

    // aka DI
    context.setState(new (require('./VASTProcessorWrapperLoadingState'))()); // eslint-disable-line global-require
    /* eslint-enable no-param-reassign */
  }
}

VASTProcessorUnwrapState.STATE_NAME = '6:Unwrap';

module.exports = VASTProcessorUnwrapState;
