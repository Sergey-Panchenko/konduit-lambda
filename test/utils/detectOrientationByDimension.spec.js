'use strict';

const expect = require('expect');

const detectOrientationByDimension = require('../../src/utils/detectOrientationByDimension');

describe('detectOrientationByDimension util', () => {
  it('should be `landscape` when width > height', () => {
    const orientation = detectOrientationByDimension({ width: 1024, height: 780 });

    expect(orientation).toEqual('landscape');
  });
  it('should be `portrait` when width < height', () => {
    const orientation = detectOrientationByDimension({ width: 780, height: 1024 });

    expect(orientation).toEqual('portrait');
  });
  it('should be `square` when width === height', () => {
    const orientation = detectOrientationByDimension({ width: 780, height: 780 });

    expect(orientation).toEqual('square');
  });
  it('should be `landscape` when nothing passed', () => {
    const orientation = detectOrientationByDimension();

    expect(orientation).toEqual('none');
  });
  it('should be `landscape` when empty object passed', () => {
    const orientation = detectOrientationByDimension({});

    expect(orientation).toEqual('none');
  });
  it('should be `landscape` when negative width and height passed', () => {
    const orientation = detectOrientationByDimension({ width: -1, height: -1 });

    expect(orientation).toEqual('none');
  });
});
