'use strict';

const url = require('url');
const cookie = require('cookie');
const tough = require('tough-cookie');
const _ = require('lodash');

const { delimiter } = require('../constants/cookies');

const moveDomainToKey = (cookieStr, hostPrefix) => {
  const parsedCookie = tough.Cookie.parse(cookieStr);
  const key = parsedCookie.key;

  parsedCookie.key = `${parsedCookie.domain || hostPrefix}${delimiter}${key}`;
  parsedCookie.domain = '';
  return parsedCookie.toString();
};

// @TODO: unit tests
function mapBy(cookies, vastUrl) {
  if (!cookies || !cookies.length) {
    return [];
  }

  return cookies.map(cookieStr => moveDomainToKey(cookieStr, url.parse(vastUrl).hostname));
}

function unmapBy(cookies, vastUrl) {
  if (!cookies || !Object.keys(cookies).length) {
    return {};
  }

  const host = url.parse(vastUrl).hostname;

  return Object.keys(cookies).reduce((acc, key) => {
    const [keyName, keyHost] = key.split(delimiter).reverse();
    const hostRegExp = new RegExp(_.escapeRegExp(keyHost));

    // @TODO: hotfix to enable sending not delimited cookies to ad servers
    if (!keyHost || (keyName && hostRegExp.test(host))) {
      acc[keyName] = cookies[key];
    }

    return acc;
  }, {});
}

function toPlain(cookies) {
  if (!cookies) {
    return '';
  }

  return Object.keys(cookies).reduce((acc, name) => `${cookie.serialize(name, cookies[name])}; ${acc}`, '');
}

/**
 * Create valid set-cookie header string by specified parameters
 * @param  {String} key - key of the cookie to set
 * @param  {String} value - value of the cookie to set
 * @param  {Date} expires - expires in
 * @param  {String} domain - cookie domain name
 * @param  {String} path - cookie path
 * @return {String} Cookie string
 */
const createSetCookieString = ({ key, value, domain, expires, path = '/' }) => {
  const cookieInstance = new tough.Cookie({ key, value, domain, expires, path });
  return cookieInstance.toString();
};

module.exports = {
  parse: cookie.parse,
  parseSetCookie: tough.parse,
  mapBy,
  unmapBy,
  toPlain,
  createSetCookieString,
};
