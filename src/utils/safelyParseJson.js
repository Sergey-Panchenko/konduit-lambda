'use strict';

const safelyParseJson = string => new Promise((resolve, reject) => {
  let result = null;
  try {
    result = JSON.parse(string);
  } catch (error) {
    reject(error);
  }

  resolve(result);
});

module.exports = safelyParseJson;
