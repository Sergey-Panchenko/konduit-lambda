'use strict';

const expect = require('expect');

const [
  normalizeKonduitQueryParams,
  prepareContextMiddleware,
] = require('../../src/routes/middleware/prepareContext');// eslint-disable-line

const {
  KONDUIT_ID,
} = require('../../src/constants/konduitParams');

describe('prepareContext middleware', () => {
  it('should result with mandatory context fields', () => {
    const mandatoryContextKeys = [
      'requestId',
      'clientId',
      'vastUrl',
      'headers',
      'cookies',
      'viewerCountry',
      'originalUrl',
      'isSecureRequest',
      'protocol',
      'allowLogs',
      'isOttRequest',
      'konduitAbType',
      'disableOptimization',
      'initialResponseCookies',
    ];

    const mockRequest = { query: {}, headers: {}, cookies: {}, get() {} };
    const mockResponse = {};
    const mockNext = expect.createSpy();

    prepareContextMiddleware(mockRequest, mockResponse, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(mockRequest.context).toExist();
    expect(mockRequest.context).toIncludeKeys(mandatoryContextKeys);
    expect(mockRequest.context.requestId).toMatch(/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[0-9a-f]{4}-[0-9a-f]{12}/i);
  });

  it('should modify query param Konduit_id to konduit_id', () => {
    const konduitId = '122333';
    const mockRequest = {
      query: { Konduit_id: konduitId, url: 'test' },
      originalUrl: '',
    };
    const mockResponse = {};
    const mockNext = expect.createSpy();

    normalizeKonduitQueryParams(mockRequest, mockResponse, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(mockRequest.query).toExist();
    expect(mockRequest.query).toIncludeKey(KONDUIT_ID);
    expect(mockRequest.query.Konduit_id).toNotExist();
    expect(mockRequest.query[KONDUIT_ID]).toEqual(konduitId);
    expect(mockRequest.query.url).toEqual('test');
  });

  it('should modify originalUrl param Konduit_id to konduit_id', () => {
    const konduitId = '122333';
    const mockRequest = {
      query: {},
      originalUrl: `/api/vastProxy?url=test&KonDuit_id=${konduitId}`,
    };
    const mockResponse = {};
    const mockNext = expect.createSpy();

    normalizeKonduitQueryParams(mockRequest, mockResponse, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(mockRequest.originalUrl).toExist();
    expect(mockRequest.originalUrl).toMatch(`konduit_id=${konduitId}`);
  });
});
