'use strict';

function toString(v) {
  return String(v);
}

function toBoolean(v) {// eslint-disable-line
  return String(v) === 'true';
}

function toInteger(v) {
  return parseInt(String(v), 10);
}

function toFloat(v) {
  return parseFloat(String(v));
}

module.exports = {
  toString,
  toBoolean,
  toInteger,
  toFloat,
};
