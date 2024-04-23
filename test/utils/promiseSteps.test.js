'use strict';

const expect = require('expect');

const promiseSteps = require('../../src/utils/promiseSteps');

const TIME_UNIT = 300;

/* eslint-disable no-promise-executor-return */
const oneSecondDeferProvider = () => new Promise(resolve => setTimeout(resolve, TIME_UNIT));


describe('promiseSteps util', () => {
  it('should sequentially execute promises from deferProviders', () => {
    const defersProvidersList = Array(3).fill(oneSecondDeferProvider);
    const defersStartTime = Date.now();

    return promiseSteps(defersProvidersList)
      .then(() => {
        const now = Date.now();
        const timePassed = now - defersStartTime;

        expect(timePassed).toBeGreaterThanOrEqualTo(3 * TIME_UNIT);
        expect(timePassed).toBeLessThanOrEqualTo(3.5 * TIME_UNIT);
      });
  })
  .timeout(5 * TIME_UNIT);

  it('should stop processing if some of defers results with truly value', () => {
    const defersProvidersList = Array(4).fill(oneSecondDeferProvider);
    defersProvidersList[2] = () => Promise.resolve(true);
    const defersStartTime = Date.now();

    return promiseSteps(defersProvidersList)
      .then(() => {
        const now = Date.now();
        const timePassed = now - defersStartTime;

        expect(timePassed).toBeGreaterThanOrEqualTo(2 * TIME_UNIT);
        expect(timePassed).toBeLessThanOrEqualTo(2.5 * TIME_UNIT);
      });
  })
  .timeout(3 * TIME_UNIT);
});
