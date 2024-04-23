'use strict';

/**
 * Convert a string to an Array
 *
 * @param {string}    strValue          - The string with values, for ex. 'abc,1.2'
 * @param {string}    itemsDelimiter    - Delimiter for items split (default - ',')
 *
 * @return {Array}                        - Array with values, for ex. [abc,1.2]
 *
 */
const convertStringToList = (strValue, itemsDelimiter = ',') => {
  if (!strValue) return [];

  return strValue
    .split(itemsDelimiter)
    .map(value => value.trim());
};

module.exports = convertStringToList;
