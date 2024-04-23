'use strict';

const intGen = (min, max) => {
  const minValue = Math.ceil(min);
  const maxValue = Math.floor(max);

  return Math.floor(Math.random() * (maxValue - minValue)) + minValue;
};

module.exports = intGen;
