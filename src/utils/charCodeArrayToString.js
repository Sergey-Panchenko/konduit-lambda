'use strict';

/**
 * @param charCodeArray {Uint8Array}
 * @returns {string}
 */
const charCodeArrayToString = (charCodeArray) => {
  let output = '';
  const fromCharCode = String.fromCharCode;

  let i;
  let len;
  for (i = 0, len = charCodeArray.length; i < len; i += 1) {
    output += fromCharCode(charCodeArray[i]);
  }

  return output;
};

module.exports = charCodeArrayToString;
