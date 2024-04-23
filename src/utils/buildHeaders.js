'use strict';

const _ = require('lodash');

// NOTE: Need to revisit this list from time to time
const prohibitedRequestHeaders = [
  'host',
  'if-match',
  'if-none-match',
  'if-modified-since',
  'if-unmodified-since',
  'content-length',
  'content-encoding',
  'x-amz-cf-id',
  'x-amzn-trace-id',
  'via',
  'cloudfront-is-mobile-viewer',
  'cloudfront-is-tablet-viewer',
  'cloudfront-is-smarttv-viewer',
  'cloudfront-is-desktop-viewer',
  'cloudfront-viewer-country',
  'cloudfront-forwarded-proto',
];

// NOTE: Response headers white list for selected clients
const allowedResponseHeaders = [
  'allow',
  'content-language',
  'date',
  'retry-after',
  'set-cookie',
  'vary',
];

const buildRequestHeaders = (originalHeaders = {}) => {
  const originalUserAgent = originalHeaders['user-agent'];
  const originalUserAgentHeaders = originalUserAgent ? {
    'x-original-user-agent': originalUserAgent,
    'x-device-user-agent': originalUserAgent,
  } : {};

  return Object.assign({},
    _.omit(originalHeaders, prohibitedRequestHeaders),
    { 'accept-encoding': 'gzip' },
    originalUserAgentHeaders
  );
};

const buildResponseHeaders = originalHeaders => _.pick(originalHeaders, allowedResponseHeaders);

module.exports = {
  buildRequestHeaders,
  buildResponseHeaders,
};
