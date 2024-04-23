'use strict';

const crypto = require('crypto');

function getHashBy(str) {
  return crypto.createHash('sha1').update(str).digest('hex');
}
module.exports = getHashBy;
