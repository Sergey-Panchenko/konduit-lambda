'use strict';

const crypto = require('crypto');

const DEFAULT_CYPHER_ALGORYTHM = 'aes-128-ofb';
const DEFAULT_WORD_ENCODING = 'utf-8';
const DEFAULT_CYPHER_ENCODING = 'hex';

/* eslint-disable max-params */

const encryptText = (
  text,
  secret,
  algorithm = DEFAULT_CYPHER_ALGORYTHM,
  wordEncoding = DEFAULT_WORD_ENCODING,
  cypherEncoding = DEFAULT_CYPHER_ENCODING
) => {
  const cipher = crypto.createCipher(algorithm, secret);
  let crypted = cipher.update(text, wordEncoding, cypherEncoding);
  crypted += cipher.final(cypherEncoding);

  return crypted;
};

const decryptText = (
  text,
  secret,
  algorithm = DEFAULT_CYPHER_ALGORYTHM,
  wordEncoding = DEFAULT_WORD_ENCODING,
  cypherEncoding = DEFAULT_CYPHER_ENCODING
) => {
  const decipher = crypto.createDecipher(algorithm, secret);
  let dec = decipher.update(text, cypherEncoding, wordEncoding);
  dec += decipher.final(wordEncoding);

  return dec;
};

const createSaltedHash = (text, salt) => {
  const hash = crypto.createHmac('md5', salt || text);
  hash.update(text);

  return hash.digest('hex');
};

module.exports = {
  encryptText,
  decryptText,
  createSaltedHash,
};
