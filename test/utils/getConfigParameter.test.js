'use strict';

const expect = require('expect');

const getConfigParameter = require('../../src/utils/getConfigParameter');

describe('getConfigParameter util', () => {
  it('VAST_REQUEST_TIMEOUT should be a integer', () => {
    expect(Number.isInteger(getConfigParameter('VAST_REQUEST_TIMEOUT'))).toEqual(true);
  });

  it('KONDUIT_PORT should be a integer', () => {
    expect(Number.isInteger(getConfigParameter('KONDUIT_PORT'))).toEqual(true);
  });

  it('LOGSTASH_PORT should be a integer', () => {
    expect(Number.isInteger(getConfigParameter('LOGSTASH_PORT'))).toEqual(true);
  });

  it('VAST_WRAPPER_NESTING_LIMIT should be a integer', () => {
    expect(Number.isInteger(getConfigParameter('VAST_WRAPPER_NESTING_LIMIT'))).toEqual(true);
  });

  it('AB_TESTING_ENABLED should be a boolean', () => {
    expect(typeof getConfigParameter('AB_TESTING_ENABLED') === 'boolean').toEqual(true);
  });

  it('LOG_RATE should be a float between 0..1', () => {
    const logRate = getConfigParameter('LOG_RATE');
    expect(logRate).toBeLessThanOrEqualTo(1);
    expect(logRate).toBeGreaterThanOrEqualTo(0);
  });

  it('CONTROL_GROUP_WRAPPER_SIZE should be a float between 0..1', () => {
    const controlGroupSize = getConfigParameter('CONTROL_GROUP_WRAPPER_SIZE');

    expect(controlGroupSize).toBeA('number');
    expect(controlGroupSize).toBeLessThanOrEqualTo(1);
    expect(controlGroupSize).toBeGreaterThanOrEqualTo(0);
  });

  it('LOGSTASH_HOST should be a string', () => {
    expect(typeof getConfigParameter('LOGSTASH_HOST') === 'string').toEqual(true);
  });

  it('LOG_FILE should be a string', () => {
    expect(typeof getConfigParameter('LOG_FILE') === 'string').toEqual(true);
  });

  it('PIXEL_TRACKER_EVENT_URL should be a string', () => {
    expect(typeof getConfigParameter('PIXEL_TRACKER_EVENT_URL') === 'string').toEqual(true);
  });

  it('PIXEL_TRACKER_ERROR_URL should be a string', () => {
    expect(typeof getConfigParameter('PIXEL_TRACKER_ERROR_URL') === 'string').toEqual(true);
  });

  it('VAST_SCHEMA should be a string', () => {
    expect(typeof getConfigParameter('VAST_SCHEMA') === 'string').toEqual(true);
  });

  it('Should be "undefined" when using a non-existing key', () => {
    expect(getConfigParameter('NON_EXISTING_KEY')).toEqual(undefined);
  });

  it('Should be "undefined" when using an undefined key', () => {
    expect(getConfigParameter(undefined)).toEqual(undefined);
  });

  it('Should be "undefined" when using no key', () => {
    expect(getConfigParameter()).toEqual(undefined);
  });
});

