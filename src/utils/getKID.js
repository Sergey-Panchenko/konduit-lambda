'use strict';

const crypto = require('crypto');

// FIXME: Consider removing the method since it is not used
const getKID = (vastUrl) => {
  const hrTime = process.hrtime();
  const nanoTime = hrTime[0] * 1E9 + hrTime[1];// eslint-disable-line
  const hmac = crypto.createHmac('sha256', 'konduit-id').update(`${vastUrl}|${Math.random()}|${nanoTime}`);

  return hmac.digest('hex');
};

module.exports = getKID;
