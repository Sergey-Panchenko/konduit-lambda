'use strict';

/* eslint-disable no-underscore-dangle */

const expect = require('expect');
const MockLogger = require('../helpers/mockLogger');

const AbstractState = require('../../src/state-machine/AbstractState');

describe('AbstractState', () => {
  let oldLogger;
  before(() => {
    oldLogger = AbstractState.LOGGER;
  });
  after(() => {
    AbstractState.LOGGER = oldLogger;
  });

  let logger;
  let state;
  beforeEach(() => {
    logger = new MockLogger({ silent: true });
    AbstractState.LOGGER = logger;
    state = new AbstractState('AbstractStateName');
  });

  describe('#constructor', () => {
    it('should throw exception when logger is not set', () => {
      AbstractState.LOGGER = null;

      expect(() => {
        new AbstractState(); // eslint-disable-line no-new
      }).toThrow('Please configure logger before use');
    });

    it('should get name and assign it to itself', () => {
      const name = 'SomeCoolName';

      const localState = new AbstractState(name);
      expect(localState.name).toEqual(name);
    });
  });

  describe('#run', () => {
    it('should assign context to itself', () => {
      const context = {};

      state.run(context);

      expect(state._context).toBe(context); // eslint-disable-line no-underscore-dangle
    });

    it('should call #onEnterState', () => {
      const onEnterStateSpy = expect.spyOn(state, 'onEnterState');
      const context = {};

      state.run(context);

      expect(onEnterStateSpy).toHaveBeenCalled();
    });
  });

  describe('#getContext', () => {
    it('should return context', () => {
      const context = {};

      state.run(context);

      expect(state.getContext()).toBe(context);
    });
  });

  describe('#onEnterState', () => {
    it('should fill an start time', () => {
      expect(state.startTimestamp).toNotExist();

      expect.spyOn(state, '_logDebug');

      state.onEnterState();

      expect(state.startTimestamp).toExist().toBeA('number');
    });

    it('should add debug log about start', () => {
      const debugLogSpy = expect.spyOn(state, '_logDebug');

      state.onEnterState();

      expect(debugLogSpy).toHaveBeenCalled();
      expect(debugLogSpy).toHaveBeenCalledWith(`on enter state: ${state.name}`, {
        command: `onEnterState.${state.name}`,
      });
    });
  });

  describe('#onExitState', () => {
    it('should fill endTimestamp and elapsedTime', () => {
      expect(state.endTimestamp).toNotExist();
      expect(state.elapsedTime).toNotExist();

      expect.spyOn(state, '_logDebug');

      state.onExitState();

      expect(state.endTimestamp).toBeA('number');
      expect(state.elapsedTime).toBeA('number');
    });

    it('should add debug log', () => {
      const debugLogSpy = expect.spyOn(state, '_logDebug');

      state.onEnterState();
      debugLogSpy.reset();

      state.onExitState();

      expect(debugLogSpy).toHaveBeenCalled();

      const logArgs = debugLogSpy.calls[0].arguments;

      expect(logArgs[0]).toEqual(`on exit state: ${state.name}`);
      expect(logArgs[1]).toIncludeKey('command', `onExitState.${state.name}`);
      expect(logArgs[1]).toIncludeKey('elapsedTime');
      expect(logArgs[1].elapsedTime).toBeA('number');
    });

    it('should clear context', () => {
      expect.spyOn(state, '_logDebug');

      const context = {};

      state.run(context);

      expect(state.getContext()).toBe(context);

      state.onExitState();

      expect(state.getContext()).toBe(null);
    });
  });

  describe('Logger', () => {
    describe('Helpers', () => {
      describe('#_prepareLogMeta', () => {
        xit('should not throw exception in case no context in state');

        it('should create newMeta if no passed meta', () => {
          const context = {
            kid: 'contextId', // TODO: generate data with faker
            clientId: 'someClientId',
            allowLogs: true,
          };

          expect.spyOn(state, 'onEnterState');

          state.run(context);

          const newMeta = state._prepareLogMeta();

          expect(newMeta).toBeAn('object');
        });

        it('should add data from context to meta', () => {
          const context = {
            kid: 'contextId', // TODO: generate data with faker
            clientId: 'someClientId',
            allowLogs: true,
          };

          expect.spyOn(state, 'onEnterState');

          state.run(context);

          const newMeta = state._prepareLogMeta({
            someAdditionData: 'data',
          });

          expect(newMeta).toMatch({
            someAdditionData: 'data',
            requestId: context.kid,
            konduitId: context.clientId,
            completeLogRecord: context.allowLogs,
          });
        });

        it.skip('should add state related data to meta', () => {
          const context = {
            kid: 'contextId', // TODO: generate data with faker
            clientId: 'someClientId',
            allowLogs: true,
          };

          expect.spyOn(state, 'onEnterState');

          state.run(context);

          const newMeta = state._prepareLogMeta({
            someAdditionData: 'data',
          });

          expect(newMeta).toMatch({
            stateName: state.name,
          });
        });

        it('should convert `state` field to `command` ralated to state', () => {
          const context = {
            kid: 'contextId', // TODO: generate data with faker
            clientId: 'someClientId',
            allowLogs: true,
          };

          expect.spyOn(state, 'onEnterState');

          state.run(context);

          const newMeta = state._prepareLogMeta({
            state: 'SomeInternalState',
          });

          expect(newMeta).toMatch({
            command: `${state.name}.SomeInternalState`,
          });

          expect(newMeta).toExcludeKey('state');
        });

        context('meta field `error` not included', () => {
          it('should not include `error` into meta', () => {
            const context = {
              kid: 'contextId', // TODO: generate data with faker
              clientId: 'someClientId',
              allowLogs: true,
            };

            expect.spyOn(state, 'onEnterState');

            state.run(context);

            const newMeta = state._prepareLogMeta();

            expect(newMeta).toExcludeKey('error');
          });
        });

        context('meta field `error` included', () => {
          it('should add `error` to meta and convert it to string', () => {
            const error = new Error('Some error message');
            const context = {
              kid: 'contextId', // TODO: generate data with faker
              clientId: 'someClientId',
              allowLogs: true,
            };

            expect.spyOn(state, 'onEnterState');

            state.run(context);

            const newMeta = state._prepareLogMeta({
              error,
            });

            expect(newMeta.error).toBeA('string');
            expect(newMeta.error).toMatch(error.message);
          });
        });
      });

      describe('.minimizeLogMeta', () => {
        it('should clean up `body` field from meta', () => {
          const newMeta = AbstractState.minimizeLogMeta({
            body: 'some cool body',
          });

          expect(newMeta).toExcludeKey('body');
        });
      });

      describe('#_prepareOptimizedLogMeta', () => {
        it('should call #_preapreLogMeta', () => {
          const context = {};
          const meta = {};
          const newMeta = {};

          expect.spyOn(state, 'onEnterState');
          state.run(context);

          const prepareLogMetaSpy = expect.spyOn(state, '_prepareLogMeta').andReturn(newMeta);

          const logMeta = state._prepareOptimizedLogMeta(meta);

          expect(prepareLogMetaSpy).toHaveBeenCalledWith(meta);
          expect(logMeta).toBe(newMeta);
        });

        it('should minimize log meta if context.allowLogs false', () => {
          const context = {
            allowLogs: false,
          };

          const meta = {};
          const newMeta = {};

          expect.spyOn(state, 'onEnterState');
          state.run(context);

          const prepareLogMetaSpy = expect.spyOn(state, '_prepareLogMeta').andReturn(newMeta);
          const minimizeLogMetaSpy = expect.spyOn(AbstractState, 'minimizeLogMeta').andReturn(newMeta);

          const logMeta = state._prepareOptimizedLogMeta(meta);

          expect(prepareLogMetaSpy).toHaveBeenCalledWith(meta);
          expect(minimizeLogMetaSpy).toHaveBeenCalled();
          expect(logMeta).toBe(newMeta);

          minimizeLogMetaSpy.restore();
        });

        it('should not minimize log meta if context.allowLogs true', () => {
          const context = {
            allowLogs: true,
          };

          const meta = {};
          const newMeta = {};

          expect.spyOn(state, 'onEnterState');
          state.run(context);

          const prepareLogMetaSpy = expect.spyOn(state, '_prepareLogMeta').andReturn(newMeta);
          const minimizeLogMetaSpy = expect.spyOn(AbstractState, 'minimizeLogMeta');

          const logMeta = state._prepareOptimizedLogMeta(meta);

          expect(prepareLogMetaSpy).toHaveBeenCalledWith(meta);
          expect(minimizeLogMetaSpy).toNotHaveBeenCalled();
          expect(logMeta).toBe(newMeta);

          minimizeLogMetaSpy.restore();
        });
      });

      describe('_enrichLogMetaWithBody', () => {
        it('should not overwrite `body` in meta ', () => {
          const context = {
            currentTextResult: 'some content',
          };

          expect.spyOn(state, 'onEnterState');
          state.run(context);

          const meta = {
            body: 'some body content',
          };

          const newMeta = state._enrichLogMetaWithBody(meta);

          expect(newMeta.body).toEqual(meta.body);
        });

        it('should add `body` to meta', () => {
          const context = {
            currentTextResult: 'some content',
          };

          expect.spyOn(state, 'onEnterState');
          state.run(context);

          const meta = {};

          const newMeta = state._enrichLogMetaWithBody(meta);

          expect(newMeta.body).toEqual(context.currentTextResult);
        });
      });

      describe('_preprocessErrorMeta', () => {
        it('should prepare meta for log', () => {
          const context = {};

          expect.spyOn(state, 'onEnterState');
          state.run(context);

          const meta = {};
          const newMeta = {};
          const prepareLogMetaSpy = expect.spyOn(state, '_prepareLogMeta').andReturn(newMeta);

          const logMeta = state._preprocessErrorMeta(meta);

          expect(prepareLogMetaSpy).toHaveBeenCalledWith(meta);
          expect(logMeta).toBe(newMeta);
        });

        it('should force enrich meta with `body` if not context.allowLogs', () => {
          const context = {
            allowLogs: false,
          };

          expect.spyOn(state, 'onEnterState');
          state.run(context);

          const meta = {};
          const newMeta = {};
          const prepareLogMetaSpy = expect.spyOn(state, '_prepareLogMeta').andReturn(newMeta);
          const enrichLogMetaWithBodySpy = expect.spyOn(state, '_enrichLogMetaWithBody').andReturn(newMeta);

          const logMeta = state._preprocessErrorMeta(meta);

          expect(prepareLogMetaSpy).toHaveBeenCalledWith(meta);
          expect(enrichLogMetaWithBodySpy).toHaveBeenCalledWith(newMeta);
          expect(logMeta).toBe(newMeta);
        });

        it('should force context.allowLogs if it already not', () => {
          const context = {
            allowLogs: false,
          };

          expect.spyOn(state, 'onEnterState');
          state.run(context);

          const meta = {};
          const newMeta = {};
          const prepareLogMetaSpy = expect.spyOn(state, '_prepareLogMeta').andReturn(newMeta);
          const enrichLogMetaWithBodySpy = expect.spyOn(state, '_enrichLogMetaWithBody').andReturn(newMeta);

          const logMeta = state._preprocessErrorMeta(meta);

          expect(prepareLogMetaSpy).toHaveBeenCalledWith(meta);
          expect(enrichLogMetaWithBodySpy).toHaveBeenCalledWith(newMeta);
          expect(logMeta).toBe(newMeta);

          expect(context.allowLogs).toBe(true); // EXPAINME wtf?
        });
      });
    });

    describe('#_logDebug', () => {
      beforeEach(() => {
        state._context = { allowLogs: true };
      });

      afterEach(() => {
        delete state._context;
      });

      it('should log debug message with prepaired meta', () => {
        const newMeta = {};

        const prepareOptimizedLogMetaSpy = expect.spyOn(state, '_prepareOptimizedLogMeta').andReturn(newMeta);

        const loggerDebugSpy = expect.spyOn(logger, 'debug');

        const message = 'Debug message';
        const meta = {};

        state._logDebug(message, meta);

        expect(prepareOptimizedLogMetaSpy).toHaveBeenCalledWith(meta);
        expect(loggerDebugSpy).toHaveBeenCalledWith(message, newMeta);
      });
    });

    describe('#_logInfo', () => {
      beforeEach(() => {
        state._context = { allowLogs: true };
      });

      afterEach(() => {
        delete state._context;
      });

      it('should log info message with prepaired meta', () => {
        const newMeta = {};

        const prepareOptimizedLogMetaSpy = expect.spyOn(state, '_prepareOptimizedLogMeta').andReturn(newMeta);

        const loggerInfoSpy = expect.spyOn(logger, 'info');

        const message = 'Info message';
        const meta = {};

        state._logInfo(message, meta);

        expect(prepareOptimizedLogMetaSpy).toHaveBeenCalledWith(meta);
        expect(loggerInfoSpy).toHaveBeenCalledWith(message, newMeta);
      });
    });

    describe('#_logWarning', () => {
      it('should log warning message with prepaired meta', () => {
        const newMeta = {};

        const prepareOptimizedLogMetaSpy = expect.spyOn(state, '_prepareOptimizedLogMeta').andReturn(newMeta);

        const loggerWarnSpy = expect.spyOn(logger, 'warn');

        const message = 'Warning message';
        const meta = {};

        state._logWarning(message, meta);

        expect(prepareOptimizedLogMetaSpy).toHaveBeenCalledWith(meta);
        expect(loggerWarnSpy).toHaveBeenCalledWith(message, newMeta);
      });
    });

    describe('#_logError', () => {
      it('should log error message with preprocessed error meta', () => {
        const newMeta = {};

        const preprocessErrorMetaSpy = expect.spyOn(state, '_preprocessErrorMeta').andReturn(newMeta);

        const loggerErrorSpy = expect.spyOn(logger, 'error');

        const message = 'Error message';
        const meta = {};

        state._logError(message, meta);

        expect(preprocessErrorMetaSpy).toHaveBeenCalledWith(meta);
        expect(loggerErrorSpy).toHaveBeenCalledWith(message, newMeta);
      });
    });
    describe('#_logWarning', () => {});
  });

  describe('#destroy', () => {
    it('just should be', () => {
      expect(state.destroy()).toBeA('undefined');
    });
  });
});
