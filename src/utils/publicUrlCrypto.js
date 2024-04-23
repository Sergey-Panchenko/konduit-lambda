'use strict';

const _ = require('lodash');
const qs = require('querystring');

const { encryptText, decryptText, createSaltedHash } = require('./encryption');

/**
 * Encrypt value using md5 hash as an encryption key
 * md5 hash uses secretKey as content and salt as password
 *
 * @param  {String} value     -- value to encrypt
 * @param  {String} secretKey -- static encryption key
 * @param  {String} salt      -- dynamic salt
 *
 * @return {String}           -- encrypted value
 */
const encryptValue = (value, secretKey, salt) => {
  const saltedEncryptionKey = createSaltedHash(secretKey, salt);

  return encryptText(value, saltedEncryptionKey);
};

/**
 * Decrypt value using md5 hash as an decryption key
 * md5 hash uses secretKey as content and salt as password
 *
 * @param  {String} value     -- value to decrypt
 * @param  {String} secretKey -- static encryption key
 * @param  {String} salt      -- dynamic salt
 *
 * @return {String}           -- decrypted value
 */
const decryptValue = (value, secretKey, salt) => {
  const saltedEncryptionKey = createSaltedHash(secretKey, salt);

  return decryptText(value, saltedEncryptionKey);
};

/**
 * [description]
 * @param  {[type]} parameterTransformFunction [description]
 * @param  {[type]} queryString                [description]
 * @return {[type]}                            [description]
 */
const transformQueryString = (parameterTransformFunction, queryString) => {
  const queryParameters = qs.parse(queryString);

  const newQuery = _(queryParameters)
    .mapValues((value, key) => parameterTransformFunction(key, value))
    .value();

  return qs.stringify(newQuery);
};

/**
 * [description]
 * @param  {[type]} queryString         [description]
 * @param  {[type]} sensitiveParameters [description]
 * @param  {[type]} secretKey           [description]
 * @return {[type]}                     [description]
 */
const encryptQueryString = (queryString, sensitiveParameters, secretKey) =>
  transformQueryString((parameter, value) => {
    if (!sensitiveParameters.has(parameter)) return value;
    return encryptValue(value, secretKey, parameter);
  }, queryString);

/**
 * [description]
 * @param  {[type]} queryString         [description]
 * @param  {[type]} sensitiveParameters [description]
 * @param  {[type]} secretKey           [description]
 * @return {[type]}                     [description]
 */
const decryptQueryString = (queryString, sensitiveParameters, secretKey) =>
  transformQueryString((parameter, value) => {
    if (!sensitiveParameters.has(parameter)) return value;
    return decryptValue(value, secretKey, parameter);
  }, queryString);

/**
 * [description]
 * @param  {[type]} queryStringTransformFunction [description]
 * @param  {[type]} urlObject                    [description]
 * @return {[type]}                              [description]
 */
const transformUrl = (queryStringTransformFunction, urlObject) => {
  let queryString = '';

  if (urlObject.search) {
    const urlSearchString = urlObject.search;
    queryString = (Array.isArray(urlSearchString) && urlSearchString.length) ?
      urlSearchString.substr(1) : urlSearchString;
  } else if (typeof urlObject.query === 'string') {
    const urlSearchString = urlObject.search;
    queryString = (Array.isArray(urlSearchString) && urlSearchString.length) ?
      urlSearchString.substr(1) : urlSearchString;
  } else {
    queryString = qs.stringify(urlObject.query);
  }

  const newQueryString = queryStringTransformFunction(queryString);
  urlObject.search = `?${newQueryString}`;

  return urlObject;
};

module.exports = {
  wrapUrlAsPublic: transformUrl.bind(null, queryString =>
    encryptQueryString(queryString, new Set(), 'secret-key')),
  unwrapPublicUrl: transformUrl.bind(null, queryString =>
    decryptQueryString(queryString, new Set(), 'secret-key')),
};
