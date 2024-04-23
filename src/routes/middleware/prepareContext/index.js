'use strict';

const { KONDUIT_ID } = require('../../../constants/konduitParams');
const normalizeKonduitQueryParams = require('./normalizeKonduitQueryParams');
const composeInitialContextData = require('./composeInitialContextData');

const safeMiddlewareCall = middleware => (request, response, next) => {
  try {
    middleware(request, response, next);
  } catch (err) {
    err.command = 'Middleware.Error';
    err.konduitId = request.query[KONDUIT_ID];
    err.requestId = request.requestId;
    err.originalUrl = request.originalUrl;
    next(err);
  }
};

module.exports = [
  safeMiddlewareCall(normalizeKonduitQueryParams),
  safeMiddlewareCall(composeInitialContextData),
];
