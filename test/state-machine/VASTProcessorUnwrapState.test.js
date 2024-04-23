'use strict';

const path = require('path');
const fs = require('fs');
const expect = require('expect');
const libxmljs = require('libxmljs');

const AbstractState = require('../../src/state-machine/AbstractState');
const VASTProcessorUnwrapState = require('../../src/state-machine/VASTProcessorUnwrapState');
const VASTProcessorWrapperLoadingState = require('../../src/state-machine/VASTProcessorWrapperLoadingState');

const MockLogger = require('../helpers/mockLogger');

const fixturesPath = path.join(__dirname, '../fixtures');
const readFixture = filename => libxmljs.parseXml(fs.readFileSync(path.join(fixturesPath, filename)));
const vastWithWrapper = readFixture('vast-wrapper-full-vpaid.xml');
const vastWithMultipleWrappers = readFixture('vast-with-multiple-wrappers.xml');

let origLogger;
describe('VASTProcessorUnwrapState', () => {
  beforeEach(() => {
    origLogger = AbstractState.LOGGER;

    AbstractState.LOGGER = new MockLogger({ silent: true });
  });

  afterEach(() => {
    AbstractState.LOGGER = origLogger;
  });

  describe('#run', () => {
    it('should reassign context.currentVastUrl with wrapper url', () => {
      const context = {
        currentVastUrl: 'http://example.com',
        wrapper: vastWithWrapper.get('//Wrapper'),
        setState: expect.createSpy(),
      };

      const state = new VASTProcessorUnwrapState();

      state.run(context);

      expect(context.currentVastUrl).toBe('https://s3.us-east-2.amazonaws.com/kme-vast-sample/vast-issues/vast_wrapper_simple/vast-inline-vpaid-1.xml');
    });

    it('should add log', () => {
      const context = {
        currentVastUrl: 'http://example.com',
        wrapper: vastWithWrapper.get('//Wrapper'),
        setState: expect.createSpy(),
        nestingLevel: 0,
      };

      const state = new VASTProcessorUnwrapState();

      const infoLogSpy = expect.spyOn(state, '_logInfo');

      state.run(context);

      expect(infoLogSpy).toHaveBeenCalledWith('Wrapper VAST tag URI', {
        state: 'WrapperFound',
        vastUrl: 'https://s3.us-east-2.amazonaws.com/kme-vast-sample/vast-issues/vast_wrapper_simple/vast-inline-vpaid-1.xml',
        vastVendor: 's3.us-east-2.amazonaws.com',
        nestingLevel: context.nestingLevel,
      });
    });

    it('should switch state to VASTProcessorWrapperLoadingState', () => {
      const context = {
        currentVastUrl: 'http://example.com',
        wrapper: vastWithWrapper.get('//Wrapper'),
        setState: expect.createSpy(),
        nestingLevel: 0,
      };

      const state = new VASTProcessorUnwrapState();

      state.run(context);

      expect(context.setState).toHaveBeenCalledWith(new VASTProcessorWrapperLoadingState());
    });

    it('should access VASTAdTagURI in relate with Wrapper node, not with Document root', () => {
      const targetWrappers = vastWithMultipleWrappers.find('//Wrapper');
      const expectableVastUrls = ['https://vast.mathtag.com/?exch', 'https://fra1-ib.adnxs.com/ab'];

      targetWrappers.forEach((targetWrapper, index) => {
        const context = {
          currentVastUrl: 'http://example.com',
          wrapper: targetWrapper,
          setState: expect.createSpy(),
          nestingLevel: 0,
        };

        const state = new VASTProcessorUnwrapState();

        state.run(context);

        expect(context.currentVastUrl.trim()).toEqual(expectableVastUrls[index]);
      });
    });
  });
});
