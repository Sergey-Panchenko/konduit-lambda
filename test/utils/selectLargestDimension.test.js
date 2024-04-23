'use strict';

const expect = require('expect');

const selectLargestDimensionTest = require('../../src/utils/selectLargestDimension');

describe('selectLargestDimension util', () => {
  it('should select the largest `landscape` dimension { width: 1280, height: 960 }' +
    ' when more mediafiles are landscape', () => {
    const { width, height } = selectLargestDimensionTest([
      { width: 1024, height: 780 },
      { width: 1280, height: 960 },
      { width: 780, height: 1024 },
      { width: 780, height: 780 },
    ]);

    expect(width).toEqual(1280);
    expect(height).toEqual(960);
  });

  it('should select the largest `portrait` dimension { width: 780, height: 1024 }' +
    ' when more mediafiles are portrait', () => {
    const { width, height } = selectLargestDimensionTest([
      { width: 1024, height: 780 },
      { width: 780, height: 1024 },
      { width: 360, height: 640 },
      { width: 780, height: 780 },
    ]);

    expect(width).toEqual(780);
    expect(height).toEqual(1024);
  });

  it('should select the largest `square` dimension { width: 780, height: 780 }' +
    ' when more mediafiles are square', () => {
    const { width, height } = selectLargestDimensionTest([
      { width: 1024, height: 780 },
      { width: 780, height: 1024 },
      { width: 780, height: 780 },
      { width: 640, height: 640 },
    ]);

    expect(width).toEqual(780);
    expect(height).toEqual(780);
  });

  it('should not fall when nothing passed', () => {
    const dimension = selectLargestDimensionTest();

    expect(dimension).toEqual({});
  });

  it('should not fall when array with one empty object passed', () => {
    const dimension = selectLargestDimensionTest([{}]);

    expect(dimension).toEqual({});
  });
});
