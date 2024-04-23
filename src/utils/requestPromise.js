'use strict';

const request = require('request');

const requestPromise = options =>
  new Promise((resolve, reject) => {
    request(options, (error, response, body) => {
      if (error) {
        return reject(error);
      }

      const statusCode = parseInt(response.statusCode, 10);
      if (!statusCode || statusCode >= 400) {
        // @TODO: add custom error here
        /* eslint prefer-promise-reject-errors: "off" */
        return reject({ statusCode: response.statusCode, options });
      }

      return resolve({ response, body });
    });
  });

module.exports = requestPromise;
