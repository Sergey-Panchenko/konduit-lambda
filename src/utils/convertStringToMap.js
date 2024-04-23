'use strict';

const _ = require('lodash');

/**
 * Convert a string to a Hash Map
 *
 * @param {string}    strValue               - The string with values, for ex. 'abc:1.2,ddd:2'
 * @param {string}    itemsDelimiter  - Delimiter for items split (default - ',')
 * @param {string}    valueDelimiter  - Delimiter for split the value in item (default - ':')
 * @param {function}  converterFunc       - Formatter of the values call as converterFunc(value)
 *
 * @return {Map}                      - Map with values, for ex. [[abc,1.2],[ddd,2]]
 *
 */
const convertStringToMap = (strValue, itemsDelimiter = ',', valueDelimiter = ':', converterFunc) => {
  if (!(typeof strValue === 'string' && strValue.indexOf(valueDelimiter) !== -1)) {
    return new Map();
  }

  const keyValueArray = strValue.trim().split(itemsDelimiter)
    .map(strItem => strItem.split(valueDelimiter))
    .filter(arrItem => arrItem.length === 2)
    .map((arrItem) => {
      const key = arrItem[0];
      const value = _.isFunction(converterFunc) ? converterFunc(arrItem[1]) : arrItem[1];

      return [key, value];
    });

  return new Map(keyValueArray);
};

module.exports = convertStringToMap;
