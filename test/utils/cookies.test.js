'use strict';

const expect = require('expect');
const { delimiter } = require('../../src/constants/cookies');

const {
  mapBy,
  unmapBy,
  toPlain,
  createSetCookieString,
} = require('../../src/utils/cookies');

describe('cookies util', () => {
  it('should add cookie domain to each cookie key', () => {
    const cookies = [
      'cookieKey0=cookieValue; Path=/; Max-Age=7776000; Expires=Tue, 05-Mar-2019 11:36:59 GMT; Domain=.test0.com',
      'cookieKey1=cookieValue; Path=/; Max-Age=7776000; Expires=Tue, 05-Mar-2019 11:36:59 GMT; Domain=.test1.com',
      'cookieKey2=cookieValue; Path=/; Max-Age=7776000; Expires=Tue, 05-Mar-2019 11:36:59 GMT',
    ];
    const result = mapBy(cookies, 'http://domain.url/').map(cookie => cookie.split('; ')[0].split('=')[0]);

    expect(result[0]).toEqual(`test0.com${delimiter}cookieKey0`);
    expect(result[1]).toEqual(`test1.com${delimiter}cookieKey1`);
    expect(result[2]).toEqual(`domain.url${delimiter}cookieKey2`);
  });

  it('should remove cookie domain from each cookie key in object and return cookies just for passed url', () => {
    const cookies = {
      'test0.com:::::cookieKey0': 'cookieValue0',
      'test1.com:::::cookieKey1': 'cookieValue1',
      'domain.url:::::cookieKey2': 'cookieValue2',
    };
    expect(unmapBy(cookies, 'http://test0.com/')).toEqual({ cookieKey0: 'cookieValue0' });

    expect(unmapBy(cookies, 'http://test1.com/')).toEqual({ cookieKey1: 'cookieValue1' });

    expect(unmapBy(cookies, 'http://domain.url/')).toEqual({ cookieKey2: 'cookieValue2' });
  });

  it('should generate plain string cookies from passed object', () => {
    const cookies = {
      'test0.com:::::cookieKey0': 'cookieValue0',
      'test1.com:::::cookieKey1': 'cookieValue1',
    };
    const plainCookies = toPlain(cookies);
    expect(plainCookies).toInclude('test0.com:::::cookieKey0=');
    expect(plainCookies).toInclude('test1.com:::::cookieKey1=');
  });

  it('should generate one cookie string from passed object', () => {
    const cookie = {
      key: 'cookieKey2',
      value: 'cookieValue',
      expires: '2019-03-05T11:36:59.000Z',
      domain: '.domain.com',
    };
    const plainCookie = createSetCookieString(cookie);
    expect(plainCookie).toInclude(`${cookie.key}=${cookie.value}`);
    expect(plainCookie).toInclude(`Expires=${cookie.expires}`);
    expect(plainCookie).toInclude(`Domain=${cookie.domain}`);
  });
});
