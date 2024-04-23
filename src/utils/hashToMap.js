'use strict';

const hashToMap = (hash) => {
  const iterable = Object.keys(hash).map(key => [key, hash[key]]);
  return new Map(iterable);
};

module.exports = hashToMap;
