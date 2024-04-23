'use strict';

/* eslint-disable class-methods-use-this */
/* eslint-disable lines-between-class-members */

class NullLogger {
  info() {}
  error() {}
  warn() {}
  debug() {}
}

module.exports = NullLogger;
