'use strict';

const expect = require('expect');

const MockLogger = require('../helpers/mockLogger');

const AbstractState = require('../../src/state-machine/AbstractState');
const VASTProcessorLoadingState = require('../../src/state-machine/VASTProcessorLoadingState');
const contextualRequest = require('../../src/utils/contextualRequest');
const metrics = require('../../src/utils/metrics');

let origLogger;
describe('VASTProcessorLoadingState', () => {
  beforeEach(() => {
    origLogger = AbstractState.LOGGER;

    AbstractState.LOGGER = new MockLogger({ silent: true });
  });

  afterEach(() => {
    AbstractState.LOGGER = origLogger;

    expect.restoreSpies();
  });

  describe('custom logic', () => {
    it('should redirect to initial url if loaded vast empty (NO_AD)', () => {
      const context = {
        currentVastUrl: 'http://some.ad.server.com/',
        redirectToInitialVastUrl: expect.createSpy(),
        setFirstVASTResponse: expect.createSpy(),
        setState: expect.createSpy(),
        vastVendorsChain: [],
        vastUrlChain: [],
      };

      const externalRequestSpy = expect.spyOn(contextualRequest, 'externalRequest')
        .andReturn(Promise.resolve({
          response: {
            headers: {},
          },
          body: '<VAST version="2.0"></VAST>',
        }));

      const state = new VASTProcessorLoadingState();

      const metricSpy = expect.spyOn(metrics, 'vastRedirectRequest');

      return state.run(context).then(() => {
        expect(context.setFirstVASTResponse).toNotHaveBeenCalled();
        expect(context.setState).toNotHaveBeenCalled();
        expect(externalRequestSpy).toHaveBeenCalled();
        expect(metricSpy).toHaveBeenCalledWith(context, { type: 'no_ad', vendor: 'some.ad.server.com' });
        expect(context.redirectToInitialVastUrl).toHaveBeenCalled();
      });
    });

    it('should not redirect if loaded vast empty and vendor One Video', () => {
      const context = {
        currentVastUrl: 'http://some.adaptv.advertising.com/',
        redirectToInitialVastUrl: expect.createSpy(),
        setFirstVASTResponse: expect.createSpy(),
        setState: expect.createSpy(),
        vastVendorsChain: [],
        vastUrlChain: [],
      };

      const externalRequestSpy = expect.spyOn(contextualRequest, 'externalRequest')
        .andReturn(Promise.resolve({
          response: {
            statusCode: 200,
            headers: {},
          },
          body: '<VAST version="2.0"></VAST>',
        }));

      const state = new VASTProcessorLoadingState();

      return state.run(context).then(() => {
        expect(context.setFirstVASTResponse).toHaveBeenCalled();
        expect(context.setState).toHaveBeenCalled();
        expect(externalRequestSpy).toHaveBeenCalled();
        expect(context.redirectToInitialVastUrl).toNotHaveBeenCalled();
      });
    });
  });
});
