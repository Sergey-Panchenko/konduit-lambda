'use strict';

/* eslint newline-per-chained-call: 0 */
/* eslint max-classes-per-file: ["error", 3] */

const expect = require('expect');
const libxmljs = require('libxmljs');
const getConfigParameter = require('../../src/utils/getConfigParameter');

const AbstractState = require('../../src/state-machine/AbstractState');
const MockLogger = require('../helpers/mockLogger');

const EventEmittingContext = require('../../src/state-machine/EventEmittingContext');
const VASTProcessorAdPodProcessingState = require('../../src/state-machine/VASTProcessorAdPodProcessingState');

AbstractState.LOGGER = new MockLogger({ silent: true });

class MockVastProcessor extends EventEmittingContext {

  constructor(context) {
    super();
    Object.assign(this, context);
    this.adpodReports = [];
    this.vastUrlChain = [];
  }

  start() {
    if (this.requestId === 'force-error') {
      this.emitError(new Error());
    } else {
      this.successfulFinish();
    }
  }

  redirectToInitialVastUrl() {
    this.emitError(new Error());
  }

  successfulFinish() {
    this.emitSuccess();
  }

  destroy() {} // eslint-disable-line

}

class BrokenMockVastProcessor extends MockVastProcessor {

  start() {
    this.emitError(new Error());
  }

}


describe('VASTProcessorAdPodProcessingState', () => {
  it('should create injected processor instance', () => {
    const state = new VASTProcessorAdPodProcessingState(null, MockVastProcessor);

    expect(new state.InternalProcessor()).toBeA(MockVastProcessor);
    return state.createChildProcessor({ requestId: 'test-case' });
  });

  it('should replace adPod correctly', () => {
    const state = new VASTProcessorAdPodProcessingState(null, MockVastProcessor);

    const xmlDoc = new libxmljs.Document();
    xmlDoc.node('VAST')
      .node('Ad').attr({ id: 1 }).node('Title', 'title1')
      .parent().parent()
      .node('Ad').attr({ id: 2 }).node('Title', 'title2')
      .parent().parent()
      .node('Ad').attr({ id: 3 }).node('Title', 'title12');

    const adPod = ['anotherAd1', 'anotherAd2', 'anotherAd3'].map((adTitle) => {
      const ad = new libxmljs.Document();
      return ad.node('Ad').node('Title', adTitle).get('//Ad');
    });

    state.xmlDoc = xmlDoc;
    state.adPod = xmlDoc.find('//Ad');
    state.replaceAdpod(adPod);

    const resultingAdList = xmlDoc.find('//Ad');
    expect(resultingAdList.length).toEqual(3);
    resultingAdList.forEach((ad, index) => {
      // TODO: Update test for the 'id' attribute
      // expect(ad.getAttribute('id')).toBe(null);
      expect(ad.get('./Title').text()).toEqual(`anotherAd${index + 1}`);
    });
  });

  describe('#run()', () => {
    let state = null;

    beforeEach(() => {
      state = new VASTProcessorAdPodProcessingState(null, MockVastProcessor);
    });

    afterEach(() => {
      state = null;
    });

    it('should limit amount of processed ADs', () => {
      const spy = expect.spyOn(state, 'createChildProcessor').andCallThrough();
      const numberOfAdsToProcess = getConfigParameter('ADPOD_NUMBER_OF_ADS_TO_PROCESS');

      const xmlDoc = new libxmljs.Document();
      xmlDoc.node('VAST');

      for (let i = 0; i < numberOfAdsToProcess + 2; i += 1) {
        xmlDoc.get('//VAST')
          .node('Ad').attr({ id: i }).node('Title', `title${i}`)
          .parent().parent();
      }

      state.run(new MockVastProcessor({ xmlDoc }));

      expect(spy).toHaveBeenCalled();
      expect(spy.calls.length).toEqual(numberOfAdsToProcess);
    });

    it('should prepare context for internal processing', () => {
      const spy = expect.spyOn(state, 'createChildProcessor').andCallThrough();

      const xmlDoc = new libxmljs.Document();
      xmlDoc.node('VAST').node('Ad').attr({ id: 1 }).node('Title', 'title1');

      state.run(new MockVastProcessor({ xmlDoc }));
      expect(spy).toHaveBeenCalled();

      const argument = spy.calls[0].arguments[0];
      expect(argument.xmlDoc).toExist();
      expect(argument.xmlDoc.toString()).toEqual(xmlDoc.get('//Ad').toString());
      expect(argument.destroyOnRequest).toBe(true);
      expect(argument.isInternalProcessor).toBe(true);
    });

    it('should always finish with same amount of ADs in AdPod', () => {
      const adPodSizes = [1, 7, 3, 5, 10];
      return Promise.all(adPodSizes.map(adPodSize => new Promise((resolve, reject) => {
        const xmlDoc = new libxmljs.Document();
        xmlDoc.node('VAST');

        for (let i = 0; i < adPodSize; i += 1) {
          xmlDoc.get('//VAST')
            .node('Ad').attr({ id: i }).node('Title', `title${i}`)
            .parent().parent();
        }

        const context = new MockVastProcessor({ xmlDoc });
        context.on(EventEmittingContext.EVENT_SUCCESS, (error, vastContext) => {
          expect(vastContext.xmlDoc.find('//Ad').length).toEqual(adPodSize);
          resolve();
        });
        context.on(EventEmittingContext.EVENT_ERROR, reject);

        state.run(context);
      })));
    });

    it('should not replace Ad if error met', () => new Promise((resolve, reject) => {
      const brokenState = new VASTProcessorAdPodProcessingState(null, BrokenMockVastProcessor);
      const xmlDoc = new libxmljs.Document();
      xmlDoc.node('VAST')
        .node('Ad').attr({ id: 1 }).node('Title', 'title1')
        .parent().parent()
        .node('Ad').attr({ id: 2 }).node('Title', 'title2')
        .parent().parent()
        .node('Ad').attr({ id: 3 }).node('Title', 'title12');

      const context = new MockVastProcessor({ xmlDoc });
      context.on(EventEmittingContext.EVENT_SUCCESS, (error, vastContext) => {
        expect(vastContext.xmlDoc.toString()).toEqual(xmlDoc.toString());
        resolve();
      });
      context.on(EventEmittingContext.EVENT_ERROR, reject);

      brokenState.run(context);
    }));
  });
});
