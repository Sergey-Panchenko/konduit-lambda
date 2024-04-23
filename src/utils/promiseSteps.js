'use strict';

const promiseSteps = deferProviders =>
  deferProviders.reduce((acc, provider) =>
    acc.then((shouldStop) => {
      if (shouldStop) return true;
      return provider();
    }), Promise.resolve(false));

module.exports = promiseSteps;
