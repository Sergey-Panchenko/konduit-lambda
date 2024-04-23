'use strict';

const expect = require('expect');

const isInitialVastContext = require('../../src/utils/isInitialVastContext');

describe('isInitialVastContext util', () => {
  it('should NOT fire for any internal AdPod context', () => {
    const context = { isInternalProcessor: true };
    const result = isInitialVastContext(context);

    expect(result).toEqual(false);
  });

  it('should NOT fire for any context with at least one Unwrapping attempt', () => {
    const contexts = [
      { nestingLevel: 1 },
      { nestingLevel: 10 },
      { nestingLevel: 100 },
    ];

    contexts.forEach((context) => {
      const result = isInitialVastContext(context);
      expect(result).toEqual(false);
    });
  });

  it('should fire for top-level context with no unwrapping attempts', () => {
    const context = {
      isInternalProcessor: false,
      nestingLevel: 0,
    };
    const result = isInitialVastContext(context);

    expect(result).toEqual(true);
  });
});
