'use strict';

const expect = require('expect');
const MacrosResolver = require('../../src/services/MacrosResolver');

describe('MacrosResolver service', () => {
  describe('constructor()', () => {
    it('should construct correctly with empty values', () => {
      const resolver = new MacrosResolver();
      expect(resolver).toBeA(MacrosResolver);
    });

    it('should compile testers for macros', () => {
      const dictionary = {
        one: ['one'],
        two: ['two', 'two'],
      };
      const provider = { one: () => 1, two: () => 2 };
      const resolver = new MacrosResolver(dictionary, provider);
      expect(resolver.macros[0].name).toEqual('one');
      expect(resolver.macros[1].name).toEqual('two');
      expect(resolver.macros[0].rule).toEqual(/(one)/gi);
      expect(resolver.macros[1].rule).toEqual(/(two)|(two)/gi);
    });

    it('should compile only macros with both dictionary and value provider', () => {
      const dictionary = { test: ['test'], another: ['test'] };
      const provider = { test: () => true };
      const resolver = new MacrosResolver(dictionary, provider);
      expect(resolver.macros[0].name).toEqual('test');
      expect(resolver.macros.length).toEqual(1);
    });

    it('should escape regexp characters in selectors', () => {
      const testCases = ['[a]', '<a>', '|a|', '|%|', '^&$'];
      const falsyTestCases = ['a', '[a', '', '%', '||', 'A'];
      const dictionary = { test: ['[a]', '<a>', '|a|', '|%|', '^&$'] };
      const provider = { test: () => true };
      const resolver = new MacrosResolver(dictionary, provider);
      testCases.forEach((testCase) => {
        expect(resolver.macros[0].rule.test(testCase)).toBe(true);
        resolver.macros[0].rule.lastIndex = 0;
      });
      falsyTestCases.forEach(testCase => expect(resolver.macros[0].rule.test(testCase)).toBe(false));
    });
  });

  describe('resolve()', () => {
    const dictionary = { test: ['|test|', '[test]', '<test>', 'tEsT'] };
    const provider = { test: () => '###' };
    const resolver = new MacrosResolver(dictionary, provider);

    const fixtures = [
      {
        before: 'test',
        after: '###',
      },
      {
        before: 'htttp://example.com?cb=[test]&b=<test>',
        after: 'htttp://example.com?cb=###&b=###',
      },
      {
        before: 'htttp://example.com?cb=|TEST|',
        after: 'htttp://example.com?cb=###',
      },
      {
        before: 'htttp://example.com?cb=[[test]]',
        after: 'htttp://example.com?cb=[###]',
      },
    ];

    fixtures.forEach((fixture) => {
      it(`${fixture.before}`, () => {
        const result = resolver.resolve(fixture.before);
        expect(result).toBe(fixture.after);
      });
    });
  });
});
