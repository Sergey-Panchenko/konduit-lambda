'use strict';

/* eslint no-useless-computed-key: 0 */

const vendors = require('./vendors').pure;

module.exports = {
  blocklist: {
    vendors: {
      [vendors['appnexus-secure']]: true,
      ['ima3vpaid.appspot.com']: true,
      ['es-sunicontent.videoplaza.tv']: true,
      // testvendor: new Set(['ua', 'uk', 'us']),
    },
    origins: [],
    clients: [],
  },
};
