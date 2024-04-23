'use strict';

const MacrosResolver = require('../services/MacrosResolver');
const konduitMacrosDictionary = require('../constants/macrosDictionary');

const generalValueProviders = {
  timestamp: () => Date.now(),
  cache_buster: () => Math.round(Math.random() * 10000000),
};

const konduitMacrosReolver = new MacrosResolver(konduitMacrosDictionary, generalValueProviders);

module.exports = url => konduitMacrosReolver.resolve(url);
