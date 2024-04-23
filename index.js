#!/usr/bin/env node

'use strict';

/**
 * Module dependencies.
 */
const toobusy = require('toobusy-js');
const debug = require('debug')('konduit-server:server');
const http = require('http');
const app = require('./src/app');
const logger = require('./src/services/logger');
const metrics = require('./src/utils/metrics');
const getConfigParameter = require('./src/utils/getConfigParameter');
const serverless = require('serverless-http');


// to enable heapdumb - uncomment the line under this comment and add heapdumb to deps
// const heapdump = require('heapdump'); // eslint-disable-line no-unused-vars

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val) {
  const port = parseInt(val, 10);

  if (Number.isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

/**
 * Get port from environment and store in Express.
 */

const port = normalizePort(getConfigParameter('KONDUIT_PORT'));
app.set('port', port);

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
  if (error.syscall !== 'listen') {
    logger.error('error.syscall !== "listen"');
    throw error;
  }

  const bind = typeof port === 'string'
    ? `Pipe ${port}`
    : `Port ${port}`;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      logger.error(`EACCES: ${bind} requires elevated privileges`);
      debug(`${bind} requires elevated privileges`);
      process.exit(1);
      break;
    case 'EADDRINUSE':
      logger.error(`EADDRINUSE: ${bind} is already in use`);
      debug(`${bind} is already in use`);
      process.exit(1);
      break;
    default:
      logger.error(`GENERIC_ERROR: ${error.toString()}`);
      throw error;
  }
}

/**
 * Create HTTP server.
 */

const server = http.createServer(app);

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
  const addr = server.address();
  const bind = typeof addr === 'string'
    ? `pipe ${addr}`
    : `port ${addr.port}`;
  logger.info(`Listening on ${bind}`);
  debug(`Listening on ${bind}`);
}

/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(port);
server.on('error', onError);
server.on('listening', onListening);

process.on('SIGINT', () => {
  server.close();
  toobusy.shutdown();
  metrics.destroy();
  process.exit();
});

module.exports.handler = serverless(app);
