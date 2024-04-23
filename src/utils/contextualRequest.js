'use strict';

const cookies = require('./cookies');
const requestPromise = require('./requestPromise');

const { buildRequestHeaders, buildResponseHeaders } = require('./buildHeaders');

/**
 * Make a request to the external API
 * Transform the initial request's headers and cookies
 *
 * @param {State} state The State object
 * @param {String} url URL for request
 * @param {object} options Addition options to request
 * @returns {Promise}
 */
function externalRequest(state, url, options = {}) {
  if (!url) {
    throw new Error('No URL for request. Please specify');
  }

  const context = state.getContext();

  // Wrap up the all request logic inside Promise for catch some errors in cookies
  return Promise.resolve()
    .then(() => {
      // TODO: Log selected headers as an object using headers field (cookie, user-agent, referrer, etc.)
      // TODO: Squash logs into one: state: 'ExternalRequest'
      state._logInfo('HTTP request original headers', {
        state: 'HttpRequestOriginalHeaders',
        completeLogRecord: context.allowLogs,
        rawHeaders: context.allowLogs ? JSON.stringify(context.headers) : undefined,
        origin: context.headers.origin,
        referer: context.headers.referer,
      });

      let cookiesObject = {};

      const cookiesForVendorDomain = cookies.unmapBy(context.cookies, url);
      cookiesObject = Object.assign({}, cookiesForVendorDomain);
      const cookieHttpHeaderString = cookies.toPlain(cookiesObject);

      /* eslint-disable no-param-reassign */
      options.url = url;
      options.gzip = true;
      options.headers = Object.assign({},
        options.headers,
        buildRequestHeaders(context.headers),
        { cookie: cookieHttpHeaderString });
      /* eslint-enable no-param-reassign */

      state._logInfo('HTTP request updated headers', {
        state: 'HttpRequestUpdatedHeaders',
        completeLogRecord: context.allowLogs,
        rawHeaders: context.allowLogs ? JSON.stringify(options.headers) : undefined,
        origin: options.headers.origin,
        referer: options.headers.referer,
      });

      return options;
    })
    .then(requestPromise)
    .then(({ response, body }) => {
      // TODO: Log selected headers as an object using headers field (set-cookie, server, etc.)
      state._logInfo('HTTP response headers', {
        state: 'HttpResponseHeaders',
        completeLogRecord: context.allowLogs,
        rawHeaders: context.allowLogs ? JSON.stringify(response.headers) : undefined,
      });

      context.lastResponseHeaders = buildResponseHeaders(response.headers); // eslint-disable-line no-param-reassign

      const newCookies = response.headers['set-cookie'] || [];

      if (newCookies) {
        context.addSetCookie(cookies.mapBy(newCookies, url));
      }

      return { response, body };
    });
}

module.exports = {
  externalRequest,
  requestPromise,
};
