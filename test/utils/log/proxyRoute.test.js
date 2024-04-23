'use strict';

const expect = require('expect');
const logger = require('../../../src/services/logger');

const proxyRouteLog = require('../../../src/utils/log/proxyRoute');

let infoLogSpy = null;
let debugLogSpy = null;
let errorLogSpy = null;

const spyOnLogger = () => {
  infoLogSpy = expect.spyOn(logger, 'info');
  debugLogSpy = expect.spyOn(logger, 'debug');
  errorLogSpy = expect.spyOn(logger, 'error');
};

const releaseLogger = () => {
  infoLogSpy.restore();
  debugLogSpy.restore();
  errorLogSpy.restore();
};

describe('Logger utils: proxyRoute', () => {
  const mandatoryFields = ['requestId', 'konduitId', 'completeLogRecord', 'elapsedTimeMS', 'command'];

  describe('#request', () => {
    const requestLogFields = ['ipAddress', 'requestMethod', 'country'];
    const request = { ip: '0.0.0.0', method: 'GET', body: '<VAST/>' };
    const context = {
      requestId: 'rid',
      clientId: 'kid',
      allowLogs: false,
      viewerCountry: 'US',
      startTime: process.hrtime(),
    };

    beforeEach(spyOnLogger);
    afterEach(releaseLogger);

    [].concat(mandatoryFields, requestLogFields).forEach((logField) => {
      it(`should always log '${logField}' field`, () => {
        proxyRouteLog.request(context, request);

        expect(debugLogSpy).toHaveBeenCalled();
        expect(debugLogSpy.calls[0].arguments[1]).toIncludeKey(logField);
        expect(debugLogSpy.calls[0].arguments[1][logField]).toNotEqual(undefined);
      });
    });

    it('should NOT log request body if allowLogs is set to 0', () => {
      proxyRouteLog.request(context, request);

      expect(debugLogSpy).toHaveBeenCalled();
      expect(debugLogSpy.calls[0].arguments[1].requestBody).toEqual(undefined);
    });

    it('should log request body if allowLogs is set to 1', () => {
      const modifiedContext = Object.assign({}, context, { allowLogs: 1 });
      proxyRouteLog.request(modifiedContext, request);

      expect(debugLogSpy).toHaveBeenCalled();
      expect(debugLogSpy.calls[0].arguments[1]).toIncludeKey('requestBody');
      expect(debugLogSpy.calls[0].arguments[1].requestBody).toNotEqual(undefined);
    });
  });

  describe('#success', () => {
    const successLogFields = ['origin', 'referer', 'userAgent'];

    const context = {
      requestId: 'rid',
      clientId: 'kid',
      allowLogs: false,
      unwrapOperationsCount: 10,
      vpaidVendor: 'fake-vpaid-vendor',
      headers: {
        origin: 'fake-origin',
        referer: 'fake-referer',
        'user-agent': 'fake-ua',
      },
      startTime: process.hrtime(),
    };

    beforeEach(spyOnLogger);
    afterEach(releaseLogger);

    [].concat(mandatoryFields, successLogFields).forEach((logField) => {
      it(`should always log '${logField}' field`, () => {
        proxyRouteLog.success(context);

        expect(infoLogSpy).toHaveBeenCalled();
        expect(infoLogSpy.calls[0].arguments[1]).toIncludeKey(logField);
        expect(infoLogSpy.calls[0].arguments[1][logField]).toNotEqual(undefined);
      });
    });

    it('should log ad-related fields', () => {
      const modifiedContext = Object.assign({}, context, {
        adpodReports: [
          {
            optimizationChain: ['wrapper'],
            vastVendorsChain: ['vendor1', 'vendor2'],
          },
          {
            optimizationChain: ['wrapper', 'vpaid'],
            vpaidVendor: 'fake-vpaid-vendor',
          },
        ],
      });

      proxyRouteLog.success(modifiedContext);
      expect(infoLogSpy).toHaveBeenCalled();

      const callArgs = infoLogSpy.calls[0].arguments[1];
      expect(callArgs).toIncludeKey('ad');
      expect(callArgs.ad).toIncludeKeys(['1', '2']);

      const expectableAdReportFields = ['optimizations', 'vastVendors',
        'vpaidVendor', 'vastUrlChain', 'vastType'];
      expect(callArgs.ad['1']).toIncludeKeys(expectableAdReportFields);
      expect(callArgs.ad['1'].optimizations).toEqual('wrapper');
      expect(callArgs.ad['1'].vastVendors).toEqual('vendor1_vendor2');
      expect(callArgs.ad['1'].vpaidVendor).toEqual('none');

      expect(callArgs.ad['2']).toIncludeKeys(expectableAdReportFields);
      expect(callArgs.ad['2'].optimizations).toEqual('wrapper_vpaid');
      expect(callArgs.ad['2'].vastVendors).toEqual('none');
      expect(callArgs.ad['2'].vpaidVendor).toEqual('fake-vpaid-vendor');
    });
  });

  describe('#redirect', () => {
    const redirectLogFields = ['origin', 'referer', 'vastUrl'];
    const context = {
      requestId: 'rid',
      clientId: 'kid',
      allowLogs: false,
      vastUrl: 'fake-url',
      unwrapOperationsCount: 10,
      headers: {
        origin: 'fake-origin',
        referer: 'fake-referer',
      },
      startTime: process.hrtime(),
    };

    beforeEach(spyOnLogger);
    afterEach(releaseLogger);

    [].concat(mandatoryFields, redirectLogFields).forEach((logField) => {
      it(`should always log '${logField}' field`, () => {
        proxyRouteLog.redirect(context);

        expect(infoLogSpy).toHaveBeenCalled();
        expect(infoLogSpy.calls[0].arguments[1]).toIncludeKey(logField);
        expect(infoLogSpy.calls[0].arguments[1][logField]).toNotEqual(undefined);
      });
    });

    it('should log ad-related fields', () => {
      const modifiedContext = Object.assign({}, context, {
        adpodReports: [
          {
            optimizationChain: ['wrapper'],
            vastVendorsChain: ['vendor1', 'vendor2'],
          },
          {
            optimizationChain: ['wrapper', 'vpaid'],
            vpaidVendor: 'fake-vpaid-vendor',
          },
        ],
      });

      proxyRouteLog.redirect(modifiedContext);
      expect(infoLogSpy).toHaveBeenCalled();

      const callArgs = infoLogSpy.calls[0].arguments[1];
      expect(callArgs).toIncludeKey('ad');
      expect(callArgs.ad).toIncludeKeys(['1', '2']);

      const expectableAdReportFields = ['optimizations', 'vastVendors',
        'vpaidVendor', 'vastUrlChain', 'vastType'];

      expect(callArgs.ad['1']).toIncludeKeys(expectableAdReportFields);
      expect(callArgs.ad['1'].optimizations).toEqual('wrapper');
      expect(callArgs.ad['1'].vastVendors).toEqual('vendor1_vendor2');
      expect(callArgs.ad['1'].vpaidVendor).toEqual('none');

      expect(callArgs.ad['2']).toIncludeKeys(expectableAdReportFields);
      expect(callArgs.ad['2'].optimizations).toEqual('wrapper_vpaid');
      expect(callArgs.ad['2'].vastVendors).toEqual('none');
      expect(callArgs.ad['2'].vpaidVendor).toEqual('fake-vpaid-vendor');
    });
  });

  describe('#error', () => {
    const context = {
      requestId: 'rid',
      clientId: 'kid',
      allowLogs: false,
      startTime: process.hrtime(),
    };

    beforeEach(spyOnLogger);
    afterEach(releaseLogger);

    [].concat(mandatoryFields).forEach((logField) => {
      it(`should always log '${logField}' field`, () => {
        proxyRouteLog.error(context, new Error());

        expect(errorLogSpy).toHaveBeenCalled();
        expect(errorLogSpy.calls[0].arguments[1]).toIncludeKey(logField);
        expect(errorLogSpy.calls[0].arguments[1][logField]).toNotEqual(undefined);
      });
    });
  });
});
