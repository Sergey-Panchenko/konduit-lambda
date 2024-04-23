'use strict';

const expect = require('expect');
const hashToMap = require('../../src/utils/hashToMap');

describe('hashToMap util', () => {
  it('should convert JS object to Map instance', () => {
    const tester = {
      one: 1,
      list: [1, 2, 3],
      property: null,
    };
    const expectedMap = new Map([
      ['one', 1],
      ['list', [1, 2, 3]],
      ['property', null],
    ]);
    const map = hashToMap(tester);
    expect(map).toBeA(Map);
    expect(map).toEqual(expectedMap);
  });
});
