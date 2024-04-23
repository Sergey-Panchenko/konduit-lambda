'use strict';

const expect = require('expect');
const EventEmittingContext = require('../../src/state-machine/EventEmittingContext');

describe('EventEmittingContext', () => {
  it('should preserve handlers', () => {
    const emitter = new EventEmittingContext({});
    emitter.on(EventEmittingContext.EVENT_SUCCESS, x => x);
    emitter.on(EventEmittingContext.EVENT_ERROR, x => x);
    expect(emitter.handlers).toIncludeKeys([EventEmittingContext.EVENT_SUCCESS, EventEmittingContext.EVENT_ERROR]);
    Object.keys(emitter.handlers).forEach((key) => {
      expect(emitter.handlers[key]).toBeA(Function);
    });
  });

  it('should emit success with nullified error and context', (done) => {
    const emitter = new EventEmittingContext({});
    emitter.on(EventEmittingContext.EVENT_SUCCESS, (error, context) => {
      expect(error).toEqual(null);
      expect(context).toBeAn(EventEmittingContext);
      done();
    });
    emitter.emitSuccess();
  });

  it('should emit error with reason and context', (done) => {
    const emitter = new EventEmittingContext({});
    emitter.on(EventEmittingContext.EVENT_ERROR, (error, context) => {
      expect(error).toEqual('testReason');
      expect(context).toBeAn(EventEmittingContext);
      done();
    });
    emitter.emitError('testReason');
  });

  it('should emit once', () => {
    const emitter = new EventEmittingContext({});
    const handlingSpy = expect.createSpy();
    emitter.on(EventEmittingContext.EVENT_ERROR, handlingSpy);
    emitter.on(EventEmittingContext.EVENT_SUCCESS, handlingSpy);
    emitter.emitError('test');
    emitter.emitSuccess();
    emitter.emitSuccess();
    emitter.emitError('no-calling');
    expect(handlingSpy).toHaveBeenCalled();
    expect(handlingSpy.calls.length).toEqual(1);
    expect(handlingSpy.calls[0].arguments).toEqual(['test', emitter]);
  });
});
