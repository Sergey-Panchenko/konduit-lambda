'use strict';

const express = require('express');

const metrics = require('../utils/metrics');
const log = require('../utils/log/proxyRoute');

const prepareContext = require('./middleware/prepareContext');

const AbstractState = require('../state-machine/AbstractState');
const VASTProcessor = require('../state-machine/VASTProcessor');

const { CLIENT_WO_ID } = require('../constants/clientIds');

const loggerService = require('../services/logger');

AbstractState.LOGGER = loggerService;

const router = express.Router();


const sendMetrics = (processingContext = {}) => {
  if (processingContext.clientId === CLIENT_WO_ID) {
    metrics.vastWoRequest(processingContext);
  }

  metrics.vastInitial(processingContext);
};

const processVastRequest = (request, response) => {
  const context = request.context || {};
  const vastProcessor = new VASTProcessor(context);

  log.request(context, request);

  vastProcessor.on(VASTProcessor.EVENT_SUCCESS, (error, processingContext) => {
    response.set('Content-Type', 'text/xml');
    response.set(processingContext.responseHeaders);
    response.send(processingContext.vastBody);

    sendMetrics(processingContext);
    log.success(processingContext);

    processingContext.destroy();
  });

  vastProcessor.on(VASTProcessor.EVENT_ERROR, (error, processingContext) => {
    response.set(processingContext.responseHeaders);

    if (error instanceof Error) {
      log.error(processingContext, error);
      const vastUrl = processingContext.vastUrl;
      if (vastUrl) {
        response.redirect(vastUrl);
      } else {
        response.status(500).send('Something went wrong');
      }
    } else if (error === 301 || error === 302) {
      log.redirect(processingContext);
      response.redirect(processingContext.vastUrl);
    } else if (error === 500) {
      log.error(processingContext, new Error('Internal server Error'));
      response.status(500).send('Something went wrong');
    } else {
      const message = processingContext.errorMessage || 'Something went wrong';
      log.error(processingContext, new Error(message));
      response.status(error).send(message);
    }

    sendMetrics(processingContext);

    processingContext.destroy();
  });

  vastProcessor.start();
};

router.get(
  '/',
  prepareContext,
  processVastRequest
);

module.exports = router;
