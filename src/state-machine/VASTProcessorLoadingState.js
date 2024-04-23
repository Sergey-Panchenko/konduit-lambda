'use strict';

const util = require('util');
const parseDataUrl = require('data-urls');

const AbstractState = require('./AbstractState');
const VASTProcessorParsingState = require('./VASTProcessorParsingState');
const ContentEncodingTypes = require('./ContentEncodingTypes');

const isValidUrl = require('../utils/isValidUrl');
const getConfigParameter = require('../utils/getConfigParameter');
const resolveMacros = require('../utils/resolveMacros');
const { isBlockedByVendor, isBlockedByOrigin, isBlockedByClient } = require('../utils/isBlockedBy');
const contextualRequest = require('../utils/contextualRequest');
const { mapUrlToVendorName, mapUrlToVendorTagValue } = require('../utils/mapUrlToVendorName');
const metrics = require('../utils/metrics');
const isInitialVastContext = require('../utils/isInitialVastContext');

const { VAST_PAYLOAD_SIZE_MIN } = require('../constants/vast');
const AD_TYPES = require('../constants/adTypes');
const vendors = require('../constants/vendors');

const VENDOR_ONE_VIDEO = vendors.detailed['one-video'].name;
const REGEXP_VAST_VERSION = /<VAST.*?version=["'](.*?)["']/;

// TODO move logic for timeout to contextualRequest?
const requestTimeout = getConfigParameter('VAST_REQUEST_TIMEOUT');

class VASTProcessorLoadingState extends AbstractState {

  constructor(stateName = VASTProcessorLoadingState.STATE_NAME) {
    super(stateName);
  }

  // @TODO: We must rethink about separating tracking and business logic
  isVastTagBlocked(context) {
    let isBlocked = false;

    const headers = context.headers || {};
    const originUrl = headers.origin;
    const { currentVastUrl, clientId } = context;

    if (originUrl && isBlockedByOrigin(originUrl)) {
      const originTag = mapUrlToVendorTagValue(originUrl);
      this._logInfo('VAST processing blocked', {
        state: 'VastBlocked',
        reason: 'origin',
        origin: originUrl,
      });

      metrics.vastRequest(context, { status: 'blocked' });
      metrics.vastBlockedRequest(context, { reason: 'origin', origin: originTag });
      metrics.vastRedirectRequest(context, { type: 'blocked', origin: originTag });

      isBlocked = true;
    }

    if (isBlockedByVendor(currentVastUrl, context.viewerCountry)) {
      const vendor = mapUrlToVendorName(currentVastUrl);
      this._logInfo('VAST processing blocked', {
        state: 'VastBlocked',
        reason: 'vendor',
        country: context.viewerCountry,
        vendor,
      });

      metrics.vastRequest(context, { status: 'blocked' });
      metrics.vastBlockedRequest(context, { reason: 'vendor', vendor });
      metrics.vastRedirectRequest(context, { type: 'blocked', vendor });

      isBlocked = true;
    }

    if (isBlockedByClient(clientId)) {
      this._logInfo('VAST processing blocked', {
        state: 'VastBlocked',
        reason: 'client',
        clientId,
      });

      // NOTE: We don't send clientId in params for "vastBlockedRequest" and "vastRedirectRequest"
      // because it already exists in every metric
      metrics.vastRequest(context, { status: 'blocked' });
      metrics.vastBlockedRequest(context, { reason: 'client' });
      metrics.vastRedirectRequest(context, { type: 'blocked' });

      isBlocked = true;
    }

    return isBlocked;
  }

  // @TODO: think about a place where we should put this method
  static compileEmptyTemplate(mediaUrl) {
    let mediaFileElementStr = '<MediaFiles/>';
    if (mediaUrl) {
      mediaFileElementStr = `
      <MediaFiles>
        <MediaFile delivery="progressive" type="video/mp4" width="640" height="360" bitrate="600">
          <![CDATA[${mediaUrl}]]>
        </MediaFile>
      </MediaFiles>
      `;
    }
    return `
      <VAST version="3.0">
      <Ad id="kme-0001-wr" sequence="1">
        <InLine>
          <AdSystem>Konduit.me</AdSystem>
          <AdTitle/>
          <Creatives>
            <Creative>
              <Linear>
                <Duration>00:00:15</Duration>
                <AdParameters/>
                ${mediaFileElementStr}
              </Linear>
            </Creative>
          </Creatives>
        </InLine>
      </Ad>
    </VAST>
    `;
  }

  run(context) {
    super.run(context);

    // @TODO Need to consider a way to prevent recursive call attack for the service
    // One way to do that is to use VAST with wrapper to the initial VAST

    context.currentVastUrl = resolveMacros(context.currentVastUrl); // eslint-disable-line
    const vastUrl = context.currentVastUrl;
    const vendor = mapUrlToVendorName(vastUrl);
    context.vastVendorsChain.push(vendor);
    context.vastUrlChain.push(vastUrl);

    if (this.isVastTagBlocked(context)) {
      context.redirectToInitialVastUrl();
      return;
    }

    let vastReceiver;
    if (isValidUrl(vastUrl)) {
      vastReceiver = this.receiveTagFromRequest(vastUrl);
    } else if (context.validDataUrl) {
      vastReceiver = VASTProcessorLoadingState.receiveTagFromDataUrl(context.currentVastUrl);
    } else {
      /* eslint-disable prefer-promise-reject-errors */
      vastReceiver = Promise.reject('No VAST tag URL provided');
    }

    // eslint-disable-next-line consistent-return
    return vastReceiver
      .then(({ response, body }) => {
        const encoding = response.headers['content-encoding'] || ContentEncodingTypes.IDENTITY;
        const bodySize = body ? body.length : 0;
        const vastVersionMatch = body.match(REGEXP_VAST_VERSION);

        context.initialLoadSuccess = true;

        let vastType = 'other';
        if (bodySize < VAST_PAYLOAD_SIZE_MIN) {
          context.isNoAd = true; // eslint-disable-line no-param-reassign
          vastType = 'no_ad';
          if (isInitialVastContext(context)) {
            context.initialAdType = AD_TYPES.NO_AD;
          }
        }

        this._logInfo('VAST xml loaded', {
          state: 'VastLoaded',
          encoding,
          body,
          bodySize,
          vastType,
          vastVendor: vendor,
          vastVersion: (vastVersionMatch && vastVersionMatch[1]) || 'unknown',
          vastUrl,
        });


        if (vastType === 'no_ad' && vendor !== VENDOR_ONE_VIDEO) {
          metrics.vastRequest(context, { status: vastType });
          metrics.vastRedirectRequest(context, { type: vastType, vendor });
          context.redirectToInitialVastUrl();
          return;
        }

        // @TODO: useless code, all 400+ responses will fall into a catch event
        if (response.statusCode >= 400) {
          metrics.vastRequest(context, { status: 'error' });
          metrics.vastRedirectRequest(context, { type: 'error', vendor });
          context.redirectToInitialVastUrl();
          return;
        }

        if (body) {
          context.setFirstVASTResponse(response, body); // set only once at first VAST request

          context.currentTextResult = body; // eslint-disable-line

          // TODO: move this logic on top
          if (context.disableOptimization) {
            metrics.vastRequest(context, { status: 'disabled' });
            metrics.vastRedirectRequest(context, { type: 'disabled', vendor });
            context.redirectToInitialVastUrl();
            return;
          }

          context.setState(new VASTProcessorParsingState());
        } else {
          // @TODO after merge KME-160
          // customResponse(this._response.headers, this._response.statusCode, this._response.buffer) {
          this._logError(`Unexpected content: [${body}]`, {});

          metrics.vastRequest(context, { status: 'empty' });
          metrics.vastRedirectRequest(context, { type: 'empty', vendor });
          context.redirectToInitialVastUrl();
        }
      }).catch((error) => {
        switch (error.code) {
          case 'ETIMEDOUT':
            this._logError(`VAST load timeout: ${requestTimeout}`, {
              state: 'VastLoadTimeout',
            });

            break;
          default:
            this._logError('External request failed', {
              state: 'HttpRequestFailed',
              vastUrl,
              error: util.inspect(error, false, null),
            });
        }

        metrics.vastRequest(context, { status: 'error' });
        metrics.vastRedirectRequest(context, { type: 'error', vendor });
        context.redirectToInitialVastUrl();
      });
  }

  static receiveTagFromTemplate(mediaUrl) {
    return Promise.resolve({
      body: VASTProcessorLoadingState.compileEmptyTemplate(mediaUrl),
      response: { headers: {} },
    });
  }

  static receiveTagFromDataUrl(dataUrl) {
    return Promise.resolve({
      body: parseDataUrl(dataUrl).body.toString(),
      response: { headers: {} },
    });
  }

  receiveTagFromRequest(vastUrl) {
    return contextualRequest.externalRequest(this, vastUrl, { timeout: requestTimeout });
  }

}

VASTProcessorLoadingState.STATE_NAME = '2:Loading';

module.exports = VASTProcessorLoadingState;
