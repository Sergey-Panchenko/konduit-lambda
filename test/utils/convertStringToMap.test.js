'use strict';

const expect = require('expect');

const convertStringToMap = require('../../src/utils/convertStringToMap');

describe('convertStringToMap util', () => {
  it('should return a Map with default setup', () => {
    const value = 'ccc:1,bbb:2';
    const result = convertStringToMap(value);

    expect(result instanceof Map).toEqual(true);
  });

  it('should have a value', () => {
    const value = 'ccc:1,bbb:2';
    const result = convertStringToMap(value);

    expect(result.has('bbb')).toEqual(true);
    expect(result.get('bbb')).toEqual(2);
  });

  it('should convert a string with spaces', () => {
    const value = '  ccc:1,bbb:2   ';
    const result = convertStringToMap(value);

    expect(result instanceof Map).toEqual(true);
    expect(result.size).toEqual(2);
    expect(result.has('bbb')).toEqual(true);
    expect(result.get('bbb')).toEqual(2);
  });

  it('should not be able to convert an empty string', () => {
    const value = '';
    const result = convertStringToMap(value);

    expect(result instanceof Map).toEqual(true);
    expect(result.size).toEqual(0);
  });

  it('should not be able to convert an invalid string', () => {
    const value = 'qwerty';
    const result = convertStringToMap(value);

    expect(result instanceof Map).toEqual(true);
    expect(result.size).toEqual(0);
  });

  it('should not be able to convert a string with a different delimiter', () => {
    const value = 'ccc:1;bbb:2';
    const result = convertStringToMap(value);

    expect(result instanceof Map).toEqual(true);
    expect(result.size).toEqual(0);
  });

  it('should be able to convert an invalid string', () => {
    const value = 'aaa:1;bbb:2,ccc:3,ddd,eee';
    const result = convertStringToMap(value);

    expect(result instanceof Map).toEqual(true);
    expect(result.size).toEqual(1);
    expect(result.has('ccc')).toEqual(true);
    expect(result.get('ccc')).toEqual(3);
  });

  it('should process a string with same keys', () => {
    const value = 'ccc:1,ccc:2';
    const result = convertStringToMap(value);

    expect(result instanceof Map).toEqual(true);
    expect(result.size).toEqual(1);
    expect(result.get('ccc')).toEqual(2);
  });

  it('should have a value with custom delimiters', () => {
    const value = 'ccc=1;bbb=2';
    const result = convertStringToMap(value, ';', '=');

    expect(result instanceof Map).toEqual(true);
    expect(result.size).toEqual(2);
    expect(result.get('bbb')).toEqual(2);
  });

  it('should have integer values with "to integer" formatter', () => {
    const value = 'ccc=1;bbb=2.2';
    const toInteger = v => parseInt(String(v), 10);
    const result = convertStringToMap(value, ';', '=', toInteger);

    expect(result.get('ccc')).toEqual(1);
    expect(result.get('bbb')).toEqual(2);
  });

  it('should have string value when formatter has incorrect type', () => {
    const value = 'ccc=1;bbb=2.2';
    const invalidConverterFunc = 'it is a string, not a function!';
    const result = convertStringToMap(value, ';', '=', invalidConverterFunc);

    expect(result.get('bbb')).toEqual('2.2');
  });

  it('should parse standard string with AOL rules', () => {
    const value = '  1v-aol-homepage-us-vpaid:0.5,1v-aol-entertainment-vip-us-vpaid:1 ';
    const toFloat = v => parseFloat(String(v));
    const result = convertStringToMap(value, ',', ':', toFloat);

    expect(result instanceof Map).toEqual(true);
    expect(result.size).toEqual(2);
    expect(result.get('1v-aol-homepage-us-vpaid')).toEqual(0.5);
    expect(result.get('1v-aol-entertainment-vip-us-vpaid')).toEqual(1);
  });
});
