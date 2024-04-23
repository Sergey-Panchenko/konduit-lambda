'use strict';

const Stack = require('./Stack');

class AbstractStateContext {
  constructor() {
    this.stateStack = new Stack();
  }

  start() {
    return new Promise(resolve =>
      /* eslint-disable no-promise-executor-return */
      resolve(this.currentState.run(this))
    );
  }

  finish() {
    if (this.currentState) {
      this.currentState.onExitState();
    }
  }

  setState(state, doNotRun) {
    const previousState = this.stateStack.peek();
    if (previousState) {
      previousState.onExitState();
    }

    this.stateStack.push(state);

    this.currentState = state;
    if (!doNotRun) {
      this.currentState.run(this);
    }
  }

}

module.exports = AbstractStateContext;
