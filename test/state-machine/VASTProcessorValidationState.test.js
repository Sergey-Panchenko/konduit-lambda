'use strict';

const expect = require('expect');
const fs = require('fs');
const path = require('path');
const libxmljs = require('libxmljs');

const AbstractState = require('../../src/state-machine/AbstractState');
const VASTProcessorValidationState = require('../../src/state-machine/VASTProcessorValidationState');
const VASTProcessorTransformState = require('../../src/state-machine/VASTProcessorTransformState');
const metrics = require('../../src/utils/metrics');

const MockLogger = require('../helpers/mockLogger');

const validVastDoc = libxmljs.parseXml(fs.readFileSync(path.join(__dirname, '../fixtures/', 'vast.xml')));
const invalidVastDoc = libxmljs.parseXml(fs.readFileSync(path.join(__dirname, '../fixtures/', 'invalid_vast.xml')));
const invalidAolVastDoc = libxmljs.parseXml(
  fs.readFileSync(path.join(__dirname, '../fixtures/', 'vast-no_ad-one-video.xml'))
);

let origLogger;

const options = {
  ias: {
    queryParams: {
      common: {},
    },
  },
};

describe('VASTProcessorValidationState', () => {
  beforeEach(() => {
    origLogger = AbstractState.LOGGER;

    AbstractState.LOGGER = new MockLogger({ silent: true });
  });

  afterEach(() => {
    AbstractState.LOGGER = origLogger;
  });

  describe('#run', () => {
    context('valid vast', () => {
      it('should add log about supporting', () => {
        const context = {
          currentVastUrl: 'http://example.com/vast.xml',
          xmlDoc: validVastDoc,
          setState: expect.createSpy(),
          options,
        };

        const state = new VASTProcessorValidationState();

        const infoLogSpy = expect.spyOn(state, '_logInfo');

        state.run(context);

        expect(infoLogSpy).toHaveBeenCalled();

        const logArgs = infoLogSpy.calls[0].arguments;
        expect(logArgs[0]).toEqual('VAST xml is supported');

        expect(logArgs[1]).toIncludeKeys(['state', 'vastVendor', 'vastSchema']);
        expect(logArgs[1]).toMatch({
          state: 'ValidVast',
          vastVendor: 'example.com',
        });
        expect(logArgs[1].vastSchema).toBeA('string');
      });

      it('should set right state for context', () => {
        const context = {
          currentVastUrl: 'http://example.com/vast.xml',
          xmlDoc: validVastDoc,
          setState: expect.createSpy(),
          options,
        };

        const state = new VASTProcessorValidationState();

        state.run(context);

        expect(context.setState).toHaveBeenCalledWith(new VASTProcessorTransformState());
      });
    });

    context('invalid vast', () => {
      it('should add log about invalid vast', () => {
        const context = {
          currentVastUrl: 'http://example.com/vast.xml',
          xmlDoc: invalidVastDoc,
          setState: expect.createSpy(),
          forwardFirstVASTResponse: expect.createSpy(),
        };

        const state = new VASTProcessorValidationState();

        const errorLogSpy = expect.spyOn(state, '_logError');

        state.run(context);

        expect(errorLogSpy).toHaveBeenCalled();

        const logArgs = errorLogSpy.calls[0].arguments;
        expect(logArgs[0]).toEqual('VAST xml is not supported');

        expect(logArgs[1]).toIncludeKeys([
          'state',
          'error',
          'vastType',
          'vastUrl',
          'vastVendor',
          'vastSchema',
        ]);
        expect(logArgs[1]).toMatch({
          state: 'InvalidVast',
          vastType: 'unsupported',
          vastUrl: context.currentVastUrl,
          vastVendor: 'example.com',
        });
        expect(logArgs[1].vastSchema).toBeA('string');
        expect(logArgs[1].error).toBeA('string');
      });

      it('should touch metrics', () => {
        const context = {
          currentVastUrl: 'http://example.com/vast.xml',
          xmlDoc: invalidVastDoc,
          setState: expect.createSpy(),
          forwardFirstVASTResponse: expect.createSpy(),
        };

        const state = new VASTProcessorValidationState();

        const metricVastRequestSpy = expect.spyOn(metrics, 'vastRequest');

        state.run(context);

        expect(metricVastRequestSpy).toHaveBeenCalledWith(context, {
          status: 'passed_as_is',
          type: 'unsupported',
        });

        metricVastRequestSpy.restore();
      });

      it('should forward response', () => {
        const context = {
          currentVastUrl: 'http://example.com/vast.xml',
          xmlDoc: invalidVastDoc,
          setState: expect.createSpy(),
          forwardFirstVASTResponse: expect.createSpy(),
        };

        const state = new VASTProcessorValidationState();

        state.run(context);

        expect(context.forwardFirstVASTResponse).toHaveBeenCalled();
      });

      it.skip('should enable custom logic for AOL CASE', () => {
        const context = {
          currentVastUrl: 'http://ad.adaptv.advertising.com/vast.xml',
          xmlDoc: invalidAolVastDoc,
          setState: expect.createSpy(),
          forwardFirstVASTResponse: expect.createSpy(),
        };

        const state = new VASTProcessorValidationState();

        const metricVastRequestSpy = expect.spyOn(metrics, 'vastRequest');

        const errorLogSpy = expect.spyOn(state, '_logError');
        const warnLogSpy = expect.spyOn(state, '_logWarning');

        state.run(context);

        expect(errorLogSpy).toNotHaveBeenCalled();
        expect(warnLogSpy).toHaveBeenCalled();

        const logArgs = warnLogSpy.calls[0].arguments;
        expect(logArgs[0]).toEqual('No Ad VAST');

        expect(logArgs[1]).toIncludeKeys([
          'state',
          'error',
          'vastType',
          'vastUrl',
          'vastVendor',
          'vastSchema',
        ]);
        expect(logArgs[1]).toMatch({
          state: 'NoAdVast',
          vastType: 'no_ad',
          vastUrl: context.currentVastUrl,
          vastVendor: 'One Video',
        });
        expect(logArgs[1].vastSchema).toBeA('string');
        expect(logArgs[1].error).toBeA('string');

        expect(metricVastRequestSpy).toHaveBeenCalledWith(context, {
          status: 'passed_as_is',
          type: 'no_ad',
        });

        expect(context.forwardFirstVASTResponse).toHaveBeenCalled();

        metricVastRequestSpy.restore();
      });
    });
  });

  describe('Validation Cases', () => {
    it('should allow CompanionAds and NonLinearAds elements in Wrapper>Creative element', () => {
      const state = new VASTProcessorValidationState();

      const context = {
        currentVastUrl: 'http://example.com/',
        xmlDoc: libxmljs.parseXml(
          fs.readFileSync(path.join(__dirname, '../fixtures/',
            'vast-wrapper-from-vast.mathtag.com-CompanionAds-issue-01.xml'), 'utf-8')
        ),
        forwardFirstVASTResponse: expect.createSpy(),
        setState: expect.createSpy(),
        options,
      };

      const errorLogSpy = expect.spyOn(state, '_logError');
      const infoLogSpy = expect.spyOn(state, '_logInfo');

      state.run(context);

      expect(errorLogSpy).toNotHaveBeenCalled('should not log error');
      expect(context.forwardFirstVASTResponse).toNotHaveBeenCalled('should not forward response');

      expect(infoLogSpy).toHaveBeenCalled();

      const logArgs = infoLogSpy.calls[0].arguments;
      expect(logArgs[0]).toBe('VAST xml is supported');
      expect(logArgs[1]).toMatch({
        state: 'ValidVast',
        vastVendor: 'example.com',
      });

      expect(logArgs[1].vastSchema).toBeA('string');

      expect(context.setState).toHaveBeenCalled();
    });

    it('should allow adID parameter in Creative element', () => {
      const state = new VASTProcessorValidationState();

      const context = {
        currentVastUrl: 'http://example.com/',
        xmlDoc: libxmljs.parseXml(
          fs.readFileSync(path.join(__dirname, '../fixtures/', 'vast-inline-AppNexus-adID-issue-01.xml'), 'utf-8')
        ),
        forwardFirstVASTResponse: expect.createSpy(),
        setState: expect.createSpy(),
        options,
      };

      const errorLogSpy = expect.spyOn(state, '_logError');
      const infoLogSpy = expect.spyOn(state, '_logInfo');

      state.run(context);

      expect(errorLogSpy).toNotHaveBeenCalled('should not log error');
      expect(context.forwardFirstVASTResponse).toNotHaveBeenCalled('should not forward response');

      expect(infoLogSpy).toHaveBeenCalled();

      const logArgs = infoLogSpy.calls[0].arguments;
      expect(logArgs[0]).toBe('VAST xml is supported');
      expect(logArgs[1]).toMatch({
        state: 'ValidVast',
        vastVendor: 'example.com',
      });

      expect(logArgs[1].vastSchema).toBeA('string');

      expect(context.setState).toHaveBeenCalled();
    });

    it('should allow adId parameter in Creative element', () => {
      const state = new VASTProcessorValidationState();

      const context = {
        currentVastUrl: 'http://example.com/',
        xmlDoc: libxmljs.parseXml(
          fs.readFileSync(path.join(__dirname, '../fixtures/', 'example_with_creative_adid_attribute.xml'), 'utf-8')
        ),
        forwardFirstVASTResponse: expect.createSpy(),
        setState: expect.createSpy(),
        options,
      };

      const errorLogSpy = expect.spyOn(state, '_logError');
      const infoLogSpy = expect.spyOn(state, '_logInfo');

      state.run(context);

      expect(errorLogSpy).toNotHaveBeenCalled('should not log error');
      expect(context.forwardFirstVASTResponse).toNotHaveBeenCalled('should not forward response');

      expect(infoLogSpy).toHaveBeenCalled();

      const logArgs = infoLogSpy.calls[0].arguments;
      expect(logArgs[0]).toBe('VAST xml is supported');
      expect(logArgs[1]).toMatch({
        state: 'ValidVast',
        vastVendor: 'example.com',
      });

      expect(logArgs[1].vastSchema).toBeA('string');

      expect(context.setState).toHaveBeenCalled();
    });

    it('should allow AdID parameter in Linear element', () => {
      const state = new VASTProcessorValidationState();

      const context = {
        currentVastUrl: 'http://example.com/',
        xmlDoc: libxmljs.parseXml(
          fs.readFileSync(path.join(__dirname, '../fixtures/', 'example_with_linear_adid_attribute.xml'), 'utf-8')
        ),
        forwardFirstVASTResponse: expect.createSpy(),
        setState: expect.createSpy(),
        options,
      };

      const errorLogSpy = expect.spyOn(state, '_logError');
      const infoLogSpy = expect.spyOn(state, '_logInfo');

      state.run(context);

      expect(errorLogSpy).toNotHaveBeenCalled('should not log error');
      expect(context.forwardFirstVASTResponse).toNotHaveBeenCalled('should not forward response');

      expect(infoLogSpy).toHaveBeenCalled();

      const logArgs = infoLogSpy.calls[0].arguments;
      expect(logArgs[0]).toBe('VAST xml is supported');
      expect(logArgs[1]).toMatch({
        state: 'ValidVast',
        vastVendor: 'example.com',
      });

      expect(logArgs[1].vastSchema).toBeA('string');

      expect(context.setState).toHaveBeenCalled();
    });

    it('should allow id, heigth and width attribures for Wrapper > NonLinear element', () => {
      const state = new VASTProcessorValidationState();

      const context = {
        currentVastUrl: 'http://example.com/',
        xmlDoc: libxmljs.parseXml(
          fs.readFileSync(path.join(__dirname, '../fixtures/', 'vast-nonlinear-attributes.xml'), 'utf-8')
        ),
        forwardFirstVASTResponse: expect.createSpy(),
        setState: expect.createSpy(),
        options,
      };

      const errorLogSpy = expect.spyOn(state, '_logError');
      const infoLogSpy = expect.spyOn(state, '_logInfo');

      state.run(context);

      expect(errorLogSpy).toNotHaveBeenCalled('should not log error');
      expect(context.forwardFirstVASTResponse).toNotHaveBeenCalled('should not forward response');

      expect(infoLogSpy).toHaveBeenCalled();

      const logArgs = infoLogSpy.calls[0].arguments;
      expect(logArgs[0]).toBe('VAST xml is supported');
      expect(logArgs[1]).toMatch({
        state: 'ValidVast',
        vastVendor: 'example.com',
      });

      expect(logArgs[1].vastSchema).toBeA('string');

      expect(context.setState).toHaveBeenCalled();
    });

    it('should allow Pricing parameter in Extensions element', () => {
      const state = new VASTProcessorValidationState();

      const context = {
        currentVastUrl: 'http://example.com/',
        xmlDoc: libxmljs.parseXml(
          fs.readFileSync(path.join(__dirname, '../fixtures/', 'vast-wrapper-tremorhub-ott-01.xml'), 'utf-8')
        ),
        forwardFirstVASTResponse: expect.createSpy(),
        setState: expect.createSpy(),
        options,
      };

      const errorLogSpy = expect.spyOn(state, '_logError');
      const infoLogSpy = expect.spyOn(state, '_logInfo');

      state.run(context);

      expect(errorLogSpy).toNotHaveBeenCalled('should not log error');
      expect(context.forwardFirstVASTResponse).toNotHaveBeenCalled('should not forward response');

      expect(infoLogSpy).toHaveBeenCalled();

      const logArgs = infoLogSpy.calls[0].arguments;
      expect(logArgs[0]).toBe('VAST xml is supported');
      expect(logArgs[1]).toMatch({
        state: 'ValidVast',
        vastVendor: 'example.com',
      });

      expect(logArgs[1].vastSchema).toBeA('string');

      expect(context.setState).toHaveBeenCalled();
    });
  });
});
