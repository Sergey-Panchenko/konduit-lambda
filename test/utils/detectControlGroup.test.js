'use strict';

const expect = require('expect');

const detectControlGroup = require('../../src/utils/detectControlGroup');

describe('detectControlGroup util', () => {
  it('should fallback to `unknown` control group', () => {
    const context = {};
    const resultingCG = detectControlGroup(context);

    expect(resultingCG).toEqual('unknown');
  });

  it('should detect `wrapper` control group', () => {
    const context = { isWrapper: true };
    const resultingCG = detectControlGroup(context);

    expect(resultingCG).toEqual('wrapper');
  });

  it('should detect `vpaid` control group', () => {
    const context = { isVpaidDetected: true, isVpaidOptimized: true };
    const resultingCG = detectControlGroup(context);

    expect(resultingCG).toEqual('vpaid-omit');
  });

  it('should detect `wrapper-vpaid` control group', () => {
    const context = { isVpaidDetected: true, isVpaidOptimized: true, isWrapper: true };
    const resultingCG = detectControlGroup(context);

    expect(resultingCG).toEqual('wrapper-vpaid-omit');
  });
});
