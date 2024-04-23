'use strict';

const toobusy = require('toobusy-js');
const express = require('express');
const cookieParser = require('cookie-parser');
const compression = require('compression');

const vastProxyRoute = require('./routes/vastProxy');
const woRequestConverter = require('./routes/middleware/woRequestConverter');

const getApiVersionString = require('./utils/getApiVersionString');
const getConfigParameter = require('./utils/getConfigParameter');
const queryToVastUrl = require('./utils/queryToVastUrl');
const isValidUrl = require('./utils/isValidUrl');

const metrics = require('./utils/metrics');
const logger = require('./services/logger');

const { KONDUIT_ID } = require('./constants/konduitParams');


const app = express();

const obtainKonduitVastUrl = query => queryToVastUrl(query);

const obtainOriginalVastUrl = (query) => {
  const originalVastUrl = obtainKonduitVastUrl(query);
  return isValidUrl(originalVastUrl) ? originalVastUrl : null;
};

app.set('query parser', 'simple');
app.disable('x-powered-by');

app.use('/api/health', function (req, res) { // eslint-disable-line
  res.sendStatus(200);
});

app.use('/api/version', function (req, res) { // eslint-disable-line
  res.send(getApiVersionString());
});

app.use(cookieParser());

const compressionLevel = getConfigParameter('VAST_RESPONSE_COMPRESSION_LEVEL');
app.use(compression({ level: compressionLevel }));

app.use((request, response, next) => {
  // NOTE: We cannot use '*' CORS origin and so we're trying to get origin from the request
  const origin = (request.headers.origin) ? request.headers.origin : '*';
  response.header('Access-Control-Allow-Origin', origin);
  response.header('Access-Control-Allow-Methods', 'GET');
  response.header('Access-Control-Allow-Credentials', true);

  next();
});

// NOTE: This is the only White Ops endpoint
app.use('/1/vps', woRequestConverter, vastProxyRoute);

app.use((req, res, next) => { // eslint-disable-line no-unused-vars
  res.status(404);

  if (req.accepts('json')) {
    res.send({ error: 'Not found' });
  } else {
    res.type('txt').send('Not found');
  }
});

app.use((error, request, response, next) => { // eslint-disable-line no-unused-vars
  logger.error('Error occurred', error);
  response.status(error.status || 500);
  response.send('Internal server error');
});

module.exports = app;
