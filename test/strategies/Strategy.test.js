'use strict';

const expect = require('expect');

const Strategy = require('../../src/strategies/Strategy');

describe('Strategy class', () => {
  describe('#constructor()', () => {
    it('should throw TypeError when `handler` is not defined', () => {
      const paramters = { handler: null };
      const tester = () => new Strategy(paramters);
      expect(tester).toThrow(/handler/);
    });

    it('should throw TypeError when `isActual` is defined and not a Function', () => {
      const paramters = { handler: () => {}, isActual: 123 };
      const tester = () => new Strategy(paramters);
      expect(tester).toThrow(/isActual/);
    });

    it('should throw TypeError when `tracking` is defined and not a Function', () => {
      const paramters = { handler: () => {}, tracking: 123 };
      const tester = () => new Strategy(paramters);
      expect(tester).toThrow(/tracking/);
    });
  });

  describe('#applyForContext()', () => {
    it('should delegate to `handler`', () => {
      const handlerSpy = expect.createSpy();
      const paramters = { handler: handlerSpy };
      const strategy = new Strategy(paramters);
      const testContext = 'tester';

      strategy.applyForContext(testContext);
      expect(handlerSpy).toHaveBeenCalledWith(testContext);
    });
  });

  describe('#isActualForContext()', () => {
    it('should delegate to `isActual`', () => {
      const isActualSpy = expect.createSpy();
      const paramters = { handler: () => {}, isActual: isActualSpy };
      const strategy = new Strategy(paramters);
      const testContext = 'tester';

      strategy.isActualForContext(testContext);
      expect(isActualSpy).toHaveBeenCalledWith(testContext);
    });

    it('should consider strategy is always actual if `isActual` is not defined', () => {
      const paramters = { handler: () => {} };
      const strategy = new Strategy(paramters);

      const result = strategy.isActualForContext({});
      expect(result).toEqual(true);
    });
  });

  describe('#track', () => {
    it('should delegate report and logger to `tracking` with `track` method', () => {
      const trackingSpy = expect.createSpy();
      const paramters = { handler: () => {}, tracking: trackingSpy };
      const strategy = new Strategy(paramters);
      const testReport = 'test-report';
      const testLogger = 'test-logger';

      strategy.track(testReport, testLogger);
      expect(trackingSpy).toHaveBeenCalledWith(testReport, testLogger);
    });
  });

  describe('#handle', () => {
    it('should call `isActual`, `handle` and `tracking` parameters sequentially', () => {
      const paramters = {
        isActual: expect.createSpy().andReturn(true),
        handler: expect.createSpy(),
        tracking: expect.createSpy(),
      };

      const testContext = 'test-context';
      const testLogger = 'test-logger';
      const strategy = new Strategy(paramters);
      strategy.handle(testContext, testLogger);

      expect(paramters.isActual).toHaveBeenCalledWith(testContext);
      expect(paramters.handler).toHaveBeenCalledWith(testContext);
      expect(paramters.tracking).toHaveBeenCalled();
    });

    it('should not call handler or tracker if isActual returns false', () => {
      const paramters = {
        isActual: expect.createSpy().andReturn(false),
        handler: expect.createSpy(),
        tracking: expect.createSpy(),
      };

      const testContext = 'test-context';
      const testLogger = 'test-logger';
      const strategy = new Strategy(paramters);
      strategy.handle(testContext, testLogger);

      expect(paramters.isActual).toHaveBeenCalledWith(testContext);
      expect(paramters.handler).toNotHaveBeenCalled();
      expect(paramters.tracking).toNotHaveBeenCalled();
    });
  });
});
