'use strict';

const getConfigParameter = require('../utils/getConfigParameter');

const VASTProcessorLoadingState = require('./VASTProcessorLoadingState');

class VASTProcessorWrapperLoadingState extends VASTProcessorLoadingState {

  constructor() {
    super(VASTProcessorWrapperLoadingState.STATE_NAME);
  }

  run(context) {
    context.nestingLevel += 1;

    if (context.nestingLevel > getConfigParameter('VAST_WRAPPER_NESTING_LIMIT')) {
      this._context = context;
      this._logError('Max nesting level reached', {
        state: 'LoadError',
        nestingLevel: context.nestingLevel,
      });
      this._context.finishWithError(400, 'Wrapper recursion limit reached by current VAST tag');
    } else {
      super.run(context);
    }
  }
}

VASTProcessorWrapperLoadingState.STATE_NAME = '7:WrapperLoad';

module.exports = VASTProcessorWrapperLoadingState;
