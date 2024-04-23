'use strict';

const fs = require('fs');
const path = require('path');
const expect = require('expect');
const libxmljs = require('libxmljs');

const AbstractState = require('../../src/state-machine/AbstractState');
const VASTProcessor = require('../../src/state-machine/VASTProcessor');
const VASTProcessorRoutingState = require('../../src/state-machine/VASTProcessorRoutingState');
const VASTProcessorAdPodProcessingState = require('../../src/state-machine/VASTProcessorAdPodProcessingState');
const VASTProcessorUnwrapState = require('../../src/state-machine/VASTProcessorUnwrapState');

const metrics = require('../../src/utils/metrics');

const MockLogger = require('../helpers/mockLogger');

const fixturesPath = path.join(__dirname, '../fixtures');

const vastWithAdPods = libxmljs.parseXml(fs.readFileSync(path.join(fixturesPath, 'ad-pod-with-wrapper.xml')));
const vastWithWrapper = libxmljs.parseXml(fs.readFileSync(path.join(fixturesPath, 'vast-wrapper-full-vpaid.xml')));
const vastWithNoVpaidMediaFile = libxmljs.parseXml(
  fs.readFileSync(path.join(fixturesPath, 'vast_with_no_vpaid_media_file.xml'))
);
const vastWithNoApiFrameworkMediaFile = libxmljs.parseXml(
  fs.readFileSync(path.join(fixturesPath, 'vast_with_no_apiFramework_attr_media_file.xml'))
);
const vastWithMediaFiles = libxmljs.parseXml(fs.readFileSync(path.join(fixturesPath, 'vast.xml')));

let origLogger;
describe('VASTProcessorRoutingState', () => {
  beforeEach(() => {
    origLogger = AbstractState.LOGGER;

    AbstractState.LOGGER = new MockLogger({ silent: true });
  });

  afterEach(() => {
    AbstractState.LOGGER = origLogger;

    expect.restoreSpies();
  });

  describe('.detectAdType', () => {
    it('should detect AdPods and return list', () => {
      const adPods = vastWithAdPods.find('//Ad');

      expect(VASTProcessorRoutingState.detectAdType(vastWithAdPods)).toEqual(['adpod', adPods]);
    });

    it('should detect first MediaFile and return it', () => {
      const mediaFile = vastWithMediaFiles.get('//MediaFile');

      expect(VASTProcessorRoutingState.detectAdType(vastWithMediaFiles)).toEqual(['mediafile', mediaFile]);
    });

    it('should detect wrapper and return it', () => {
      const wrapper = vastWithWrapper.get('//Wrapper');

      expect(VASTProcessorRoutingState.detectAdType(vastWithWrapper)).toEqual(['wrapper', wrapper]);
    });

    it('should return empty array if no detected any cases', () => {
      const emptyXmlDoc = new libxmljs.Document();

      emptyXmlDoc.node('VAST');

      expect(VASTProcessorRoutingState.detectAdType(emptyXmlDoc)).toEqual([]);
    });
  });

  describe('.checkNoVpaid', () => {
    it('should return true if apiFramework is not VPAID', () => {
      const mediaFile = vastWithNoVpaidMediaFile.get('//MediaFile');

      expect(VASTProcessorRoutingState.checkNoVpaid(mediaFile)).toBe(true);
    });

    it('should return true if no apiFramework attribute', () => {
      const mediaFile = vastWithNoApiFrameworkMediaFile.get('//MediaFile');

      expect(VASTProcessorRoutingState.checkNoVpaid(mediaFile)).toBe(true);
    });

    it('should return false if apiFramework is VPAID', () => {
      const mediaFile = vastWithMediaFiles.get('//MediaFile');

      expect(VASTProcessorRoutingState.checkNoVpaid(mediaFile)).toBe(false);
    });
  });


  context('AdPod', () => {
    it('should add log about finding adpods', () => {
      const context = {
        currentVastUrl: 'http://example.com/vast.xml',
        xmlDoc: { get() {} },
        setState: expect.createSpy(),
        optimizationChain: [],
      };

      const detectSpy = expect.spyOn(VASTProcessorRoutingState, 'detectAdType').andReturn(['adpod', [{}, {}]]);

      const state = new VASTProcessorRoutingState();

      const infoLogSpy = expect.spyOn(state, '_logInfo');

      state.run(context);

      expect(detectSpy).toHaveBeenCalledWith(context.xmlDoc);

      expect(infoLogSpy).toHaveBeenCalledWith('Ad Pod found (multiple Ad tags)', {
        state: 'AdPodFound',
        adPodCount: 2,
        vastVendor: 'example.com',
      });
    });

    it('should route AdPods to VASTProcessorAdPodProcessingState', () => {
      const context = {
        currentVastUrl: 'http://example.com/vast.xml',
        xmlDoc: { get() {} },
        setState: expect.createSpy(),
        optimizationChain: [],
      };

      const detectSpy = expect.spyOn(VASTProcessorRoutingState, 'detectAdType').andReturn(['adpod', [{}]]);

      const state = new VASTProcessorRoutingState();

      state.run(context);

      expect(detectSpy).toHaveBeenCalledWith(context.xmlDoc);

      expect(context.setState).toHaveBeenCalledWith(new VASTProcessorAdPodProcessingState(null, VASTProcessor));
    });
  });

  context('MediaFile', () => {
    context('no vpaid', () => {
      it('should enable custom logic and finish request', () => {
        const context = {
          currentVastUrl: 'http://example.adaptv.advertising.com/vast.xml',
          xmlDoc: { get() {} },
          successfulFinish: expect.createSpy(),
          optimizationChain: [],
        };

        const doc = new libxmljs.Document();
        const mediaFile = new libxmljs.Element(doc, 'MediaFile');

        const state = new VASTProcessorRoutingState();

        const detectSpy = expect.spyOn(VASTProcessorRoutingState, 'detectAdType').andReturn(['mediafile', mediaFile]);
        const checkSpy = expect.spyOn(VASTProcessorRoutingState, 'checkNoVpaid').andReturn(true);
        const infoLogSpy = expect.spyOn(state, '_logInfo');
        const vastRequestMetricSpy = expect.spyOn(metrics, 'vastRequest');

        state.run(context);

        expect(detectSpy).toHaveBeenCalledWith(context.xmlDoc);
        expect(checkSpy).toHaveBeenCalledWith(mediaFile);

        expect(infoLogSpy).toHaveBeenCalledWith('No VPAID unit to process', {
          state: 'NoVpaid',
          vastVendor: 'One Video',
        });

        expect(vastRequestMetricSpy).toHaveBeenCalledWith(context, {
          status: 'passed_as_is',
          type: 'no_vpaid',
        });

        expect(context.successfulFinish).toHaveBeenCalled();
      });

      it('should send processed metric logic if context.isWrapper', () => {
        const context = {
          currentVastUrl: 'http://example.adserver.com/vast.xml',
          xmlDoc: { get() {} },
          successfulFinish: expect.createSpy(),
          isWrapper: true,
          konduitAbTesting: '0',
          optimizationChain: [],
        };

        const doc = new libxmljs.Document();
        const mediaFile = new libxmljs.Element(doc, 'MediaFile');

        const state = new VASTProcessorRoutingState();

        const detectSpy = expect.spyOn(VASTProcessorRoutingState, 'detectAdType').andReturn(['mediafile', mediaFile]);
        const checkSpy = expect.spyOn(VASTProcessorRoutingState, 'checkNoVpaid').andReturn(true);
        const infoLogSpy = expect.spyOn(state, '_logInfo');
        const vastRequestMetricSpy = expect.spyOn(metrics, 'vastRequest');

        state.run(context);

        expect(detectSpy).toHaveBeenCalledWith(context.xmlDoc);
        expect(checkSpy).toHaveBeenCalledWith(mediaFile);

        expect(infoLogSpy).toHaveBeenCalledWith('No VPAID unit to process', {
          state: 'NoVpaid',
          vastVendor: 'example.adserver.com',
        });

        expect(vastRequestMetricSpy).toHaveBeenCalled();
        expect(vastRequestMetricSpy.calls[0].arguments[1].status).toEqual('processed');

        expect(context.successfulFinish).toHaveBeenCalled();
      });
    });

    context('vpaid', () => {
      it('should add log about vpaid', () => {
        const context = {
          currentVastUrl: 'http://example.com/vast.xml',
          xmlDoc: { get() {} },
          setState: expect.createSpy(),
          optimizationChain: [],
          successfulFinish: () => {},
        };

        const mediaFile = vastWithMediaFiles.get('//MediaFile');

        const state = new VASTProcessorRoutingState();

        const detectSpy = expect.spyOn(VASTProcessorRoutingState, 'detectAdType').andReturn(['mediafile', mediaFile]);
        const checkSpy = expect.spyOn(VASTProcessorRoutingState, 'checkNoVpaid').andReturn(false);
        const infoLogSpy = expect.spyOn(state, '_logInfo');

        state.run(context);

        expect(detectSpy).toHaveBeenCalledWith(context.xmlDoc);
        expect(checkSpy).toHaveBeenCalledWith(mediaFile);

        expect(infoLogSpy).toHaveBeenCalledWith('VPAID found', {
          state: 'VpaidFound',
          vastVendor: 'example.com',
          vpaidType: 'application/x-shockwave-flash',
          vpaidUrl: 'http://cdn-sys.brainient.com/flash/v6/buttonv7.0.2.swf?video_id=34f8e4e6-e83c-46da-8bf6-a37ae9ed5134&user_id=1228&tzone=&settings=json&settingsPath=http%3A%2F%2Fcdn-tags.brainient.com%2F1228%2F34f8e4e6-e83c-46da-8bf6-a37ae9ed5134%2Fconfig.json',
          vpaidVendor: 'cdn-sys.brainient.com',
        });
      });

      it('should enable custom logic for AOL', () => {
        const context = {
          currentVastUrl: 'http://example.advertising.com/vast.xml',
          xmlDoc: { get() {} },
          setState: expect.createSpy(),
          optimizationChain: [],
          successfulFinish: () => {},
        };

        const mediaFile = vastWithMediaFiles.get('//MediaFile');

        const state = new VASTProcessorRoutingState();

        const detectSpy = expect.spyOn(VASTProcessorRoutingState, 'detectAdType').andReturn(['mediafile', mediaFile]);
        const checkSpy = expect.spyOn(VASTProcessorRoutingState, 'checkNoVpaid').andReturn(false);

        state.run(context);

        expect(detectSpy).toHaveBeenCalledWith(context.xmlDoc);
        expect(checkSpy).toHaveBeenCalledWith(mediaFile);
      });

      it('should assign mediaFile to context', () => {
        const context = {
          currentVastUrl: 'http://example.advertising.com/vast.xml',
          xmlDoc: { get() {} },
          setState: expect.createSpy(),
          optimizationChain: [],
          successfulFinish: () => {},
        };

        const mediaFile = vastWithMediaFiles.get('//MediaFile');

        const state = new VASTProcessorRoutingState();

        const detectSpy = expect.spyOn(VASTProcessorRoutingState, 'detectAdType').andReturn(['mediafile', mediaFile]);
        const checkSpy = expect.spyOn(VASTProcessorRoutingState, 'checkNoVpaid').andReturn(false);

        state.run(context);

        expect(detectSpy).toHaveBeenCalledWith(context.xmlDoc);
        expect(checkSpy).toHaveBeenCalledWith(mediaFile);

        expect(context.mediaFile).toBe(mediaFile);
      });
    });
  });

  context('Wrapper', () => {
    it('should add log', () => {
      const context = {
        currentVastUrl: 'http://example.com/vast.xml',
        xmlDoc: { get() {} },
        wrappersChain: [],
        setState: expect.createSpy(),
        wrapper: null,
        optimizationChain: [],
      };

      const wrapper = {};

      const state = new VASTProcessorRoutingState();

      const detectSpy = expect.spyOn(VASTProcessorRoutingState, 'detectAdType')
        .andReturn(['wrapper', wrapper]);
      const infoLogSpy = expect.spyOn(state, '_logInfo');

      state.run(context);

      expect(detectSpy).toHaveBeenCalledWith(context.xmlDoc);

      expect(infoLogSpy).toHaveBeenCalledWith('Wrapper found', {
        state: 'WrapperFound',
        vastVendor: 'example.com',
      });
    });

    it('should add wrapper document to context.wrappersChain', () => {
      const context = {
        currentVastUrl: 'http://example.com/vast.xml',
        xmlDoc: { get() {} },
        wrappersChain: [],
        setState: expect.createSpy(),
        wrapper: null,
        optimizationChain: [],
      };

      const wrapper = {};

      const state = new VASTProcessorRoutingState();

      const detectSpy = expect.spyOn(VASTProcessorRoutingState, 'detectAdType')
        .andReturn(['wrapper', wrapper]);

      state.run(context);

      expect(detectSpy).toHaveBeenCalledWith(context.xmlDoc);

      expect(context.wrappersChain[0]).toBe(context.xmlDoc);
    });

    it('should add wrapper to context and set isWrapper flag', () => {
      const context = {
        currentVastUrl: 'http://example.com/vast.xml',
        xmlDoc: { get() {} },
        wrappersChain: [],
        setState: expect.createSpy(),
        wrapper: null,
        optimizationChain: [],
      };

      const wrapper = {};

      const state = new VASTProcessorRoutingState();

      const detectSpy = expect.spyOn(VASTProcessorRoutingState, 'detectAdType')
        .andReturn(['wrapper', wrapper]);

      state.run(context);

      expect(detectSpy).toHaveBeenCalledWith(context.xmlDoc);

      expect(context.wrapper).toBe(wrapper);
      expect(context.isWrapper).toBe(true);
    });

    it('should route to VASTProcessorUnwrapState', () => {
      const context = {
        currentVastUrl: 'http://example.com/vast.xml',
        xmlDoc: { get() {} },
        wrappersChain: [],
        setState: expect.createSpy(),
        wrapper: null,
        optimizationChain: [],
      };

      const wrapper = {};

      const state = new VASTProcessorRoutingState();

      const detectSpy = expect.spyOn(VASTProcessorRoutingState, 'detectAdType')
        .andReturn(['wrapper', wrapper]);

      state.run(context);

      expect(detectSpy).toHaveBeenCalledWith(context.xmlDoc);
      expect(context.setState).toHaveBeenCalledWith(new VASTProcessorUnwrapState());
    });
  });

  context('NO CASE (Default)', () => {
    it('should add log', () => {
      const context = {
        currentVastUrl: 'http://example.com/vast.xml',
        xmlDoc: { get() {} },
        redirectToInitialVastUrl: expect.createSpy(),
        optimizationChain: [],
      };

      const state = new VASTProcessorRoutingState();

      const detectSpy = expect.spyOn(VASTProcessorRoutingState, 'detectAdType').andReturn([]);
      const warningLogSpy = expect.spyOn(state, '_logWarning');

      state.run(context);

      expect(detectSpy).toHaveBeenCalledWith(context.xmlDoc);
      expect(warningLogSpy).toHaveBeenCalledWith('No unit to process', {
        state: 'NoUnitFound',
        vastVendor: 'example.com',
      });
    });

    it('should call vastRedirectRequest metric', () => {
      const context = {
        currentVastUrl: 'http://example.com/vast.xml',
        xmlDoc: { get() {} },
        redirectToInitialVastUrl: expect.createSpy(),
        optimizationChain: [],
      };

      const state = new VASTProcessorRoutingState();
      const detectSpy = expect.spyOn(VASTProcessorRoutingState, 'detectAdType').andReturn([]);
      const vastRedirectMetricSpy = expect.spyOn(metrics, 'vastRedirectRequest');

      state.run(context);

      expect(detectSpy).toHaveBeenCalled();
      expect(vastRedirectMetricSpy).toHaveBeenCalledWith(context, {
        type: 'invalid',
        vendor: 'example.com',
      });
    });

    it('should redirectToInitialVastUrl request', () => {
      const context = {
        currentVastUrl: 'http://example.com/vast.xml',
        xmlDoc: { get() {} },
        redirectToInitialVastUrl: expect.createSpy(),
        optimizationChain: [],
      };

      const state = new VASTProcessorRoutingState();

      const detectSpy = expect.spyOn(VASTProcessorRoutingState, 'detectAdType').andReturn([]);

      state.run(context);

      expect(detectSpy).toHaveBeenCalledWith(context.xmlDoc);
      expect(context.redirectToInitialVastUrl).toHaveBeenCalled();
    });
  });
});
