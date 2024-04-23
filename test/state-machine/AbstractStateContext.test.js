'use strict';

const expect = require('expect');

const AbstractStateContext = require('../../src/state-machine/AbstractStateContext');

describe('AbstractStateContext', () => {
  describe('#finish', () => {
    it('should call state.onExitState', () => {
      const state = {
        onExitState: expect.createSpy(),
      };

      const context = new AbstractStateContext();
      context.setState(state, true);

      context.finish();

      expect(state.onExitState).toHaveBeenCalled();
    });
  });

  describe('#setState', () => {
    it('should add new state and run in', () => {
      const state = {
        onExitState: expect.createSpy(),
      };

      const newState = {
        run: expect.createSpy(),
      };

      const context = new AbstractStateContext();
      context.setState(state, true);

      context.setState(newState);

      expect(state.onExitState).toHaveBeenCalled();
      expect(newState.run).toHaveBeenCalledWith(context);

      expect(context.currentState).toEqual(newState);
      expect(context.stateStack.toArray()).toEqual([state, newState]);
    });
  });
});
