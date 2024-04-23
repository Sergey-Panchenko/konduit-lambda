'use strict';

/* eslint-disable no-underscore-dangle */

const expect = require('expect');
const Stack = require('../../src/state-machine/Stack');

describe('Stack', () => {
  let stack;
  beforeEach(() => {
    stack = new Stack();
  });

  describe('#constructor', () => {
    it('should create an empty store', () => {
      expect(stack._store).toEqual([]);
    });
  });

  describe('#push', () => {
    it('should push value to store', () => {
      const value1 = 'value1';
      const value2 = 'value2';
      stack.push(value1);
      expect(stack._store).toEqual([value1]);

      stack.push(value2);
      expect(stack._store).toEqual([value1, value2]);
    });
  });

  describe('#pop', () => {
    it('should pop value from store', () => {
      const value1 = 'value1';
      const value2 = 'value2';
      stack.push(value1);
      stack.push(value2);

      expect(stack.pop()).toEqual(value2);
      expect(stack.pop()).toEqual(value1);

      expect(stack._store).toEqual([]);
    });
  });

  describe('#peek', () => {
    it('should return latest element from store', () => {
      const value1 = 'value1';
      const value2 = 'value2';

      expect(stack.peek()).toBe(undefined);

      stack.push(value1);
      expect(stack.peek()).toEqual(value1);

      stack.push(value2);
      expect(stack.peek()).toEqual(value2);

      expect(stack._store).toEqual([value1, value2]);
    });
  });

  describe('#isEmpty', () => {
    it('should return true when store is empty', () => {
      expect(stack.isEmpty()).toBe(true);
    });

    it('should return false when store it not empty', () => {
      stack.push('value1');

      expect(stack.isEmpty()).toBe(false);
    });
  });

  describe('#toArray', () => {
    it('should return a copy of store', () => {
      const value1 = 'value1';
      const value2 = 'value2';
      stack.push(value1);
      stack.push(value2);

      const plainStack = stack.toArray();

      expect(plainStack).toEqual(stack._store).toNotBe(stack._store);
    });
  });
});
