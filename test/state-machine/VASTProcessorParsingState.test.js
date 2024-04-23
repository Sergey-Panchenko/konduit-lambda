'use strict';

const expect = require('expect');
const fs = require('fs');
const path = require('path');
const libxmljs = require('libxmljs');

const AbstractState = require('../../src/state-machine/AbstractState');
const VASTProcessorParsingState = require('../../src/state-machine/VASTProcessorParsingState');
const VASTProcessorValidationState = require('../../src/state-machine/VASTProcessorValidationState');
const metrics = require('../../src/utils/metrics');

const MockLogger = require('../helpers/mockLogger');

let origLogger;
describe('VASTProcessorParsingState', () => {
  beforeEach(() => {
    origLogger = AbstractState.LOGGER;

    AbstractState.LOGGER = new MockLogger({ silent: true });
  });

  afterEach(() => {
    AbstractState.LOGGER = origLogger;

    expect.restoreSpies();
  });

  describe('#run', () => {
    context('VALID XML', () => {
      it.skip('should parse xml and assign xmlDoc to context', () => {
        const context = {
          currentTextResult: fs.readFileSync(path.join(__dirname, '../fixtures/', 'vast.xml'), 'utf8'),
          setState: expect.createSpy(),
        };

        const state = new VASTProcessorParsingState();

        return state.run(context).then(() => {
          expect(context).toIncludeKey('xmlDoc');
          expect(context.xmlDoc).toBeA(libxmljs.Document);
        });
      });

      it('should add log', () => {
        const context = {
          currentTextResult: fs.readFileSync(path.join(__dirname, '../fixtures/', 'vast.xml'), 'utf8'),
          setState: expect.createSpy(),
        };

        const state = new VASTProcessorParsingState();

        const infoLogSpy = expect.spyOn(state, '_logInfo');

        return state.run(context).then(() => {
          expect(infoLogSpy).toHaveBeenCalledWith('VAST successfully parsed', {
            state: 'ParseSuccess',
          });
        });
      });

      it('should call next step: VASTProcessorValidationState', () => {
        const context = {
          currentTextResult: fs.readFileSync(path.join(__dirname, '../fixtures/', 'vast.xml'), 'utf8'),
          setState: expect.createSpy(),
        };

        const state = new VASTProcessorParsingState();

        return state.run(context).then(() => {
          expect(context.setState).toHaveBeenCalledWith(new VASTProcessorValidationState());
        });
      });
    });

    context('INVALID XML', () => {
      it('should log error', () => {
        const context = {
          currentTextResult: '<super bad xml',
          redirectToInitialVastUrl: expect.createSpy(),
        };

        const state = new VASTProcessorParsingState();

        const errorLogSpy = expect.spyOn(state, '_logError');

        return state.run(context).then(() => {
          expect(errorLogSpy).toHaveBeenCalled();

          const logArgs = errorLogSpy.calls[0].arguments;

          expect(logArgs[0]).toBe('VAST XML parse error');

          expect(logArgs[1]).toIncludeKeys(['state', 'error']);
          expect(logArgs[1].state).toBe('ParseError');
          expect(logArgs[1].error).toBeA(Error);
        });
      });

      it('should redirectToInitialVastUrl', () => {
        const context = {
          currentTextResult: '<super bad xml',
          setState: expect.createSpy(),
          redirectToInitialVastUrl: expect.createSpy(),
        };

        const state = new VASTProcessorParsingState();

        return state.run(context).then(() => {
          expect(context.setState).toNotHaveBeenCalled();

          expect(context.redirectToInitialVastUrl).toHaveBeenCalled();
        });
      });

      it('should act on metrics', () => {
        const context = {
          currentTextResult: '<super bad xml',
          setState: expect.createSpy(),
          redirectToInitialVastUrl: expect.createSpy(),
        };

        const state = new VASTProcessorParsingState();

        const vastRequestMetricSpy = expect.spyOn(metrics, 'vastRedirectRequest');

        return state.run(context).then(() => {
          expect(vastRequestMetricSpy).toHaveBeenCalled();
          expect(vastRequestMetricSpy.calls.length).toEqual(1);

          expect(vastRequestMetricSpy).toHaveBeenCalledWith(context, { type: 'unsupported' });
        });
      });
    });
  });
});
