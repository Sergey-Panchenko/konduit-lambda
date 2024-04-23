'use strict';

const http = require('http');

function httpLoader(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let rawData = '';
      res.setEncoding('utf8');
      res.on('data', chunk => rawData += chunk); // eslint-disable-line
      res.on('end', () => {
        resolve(rawData);
      });
    }).on('error', (e) => {
      // res.resume();// @GC|free up memory
      reject(e);
    });
  });
}

module.exports = httpLoader;
