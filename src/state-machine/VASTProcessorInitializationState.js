'use strict';

const loggerSerice = require('../services/logger');
const konduitParams = require('../constants/konduitParams');
const isValidUrl = require('../utils/isValidUrl');
const isValidClientId = require('../utils/isValidClientId');
const { mapUrlToVendorName } = require('../utils/mapUrlToVendorName');
const AbstractState = require('./AbstractState');
const VASTProcessorLoadingState = require('./VASTProcessorLoadingState');
const getConfigParameter = require('../utils/getConfigParameter');
const queryToVastUrl = require('../utils/queryToVastUrl');
const metrics = require('../utils/metrics');
const isValidDataUrl = require('../utils/isValidDataUrl');

const { initialStrategies } = require('../strategies');

const maximumAllowedAdPodSize = getConfigParameter('ADPOD_MAXIMUM_ADS_TO_PROCESS');

const {
  CLIENT_WO_ID,
} = require('../constants/clientIds');


// @todo: this state should be refactored and partially moved into prepareContext utility
class VASTProcessorInitializationState extends AbstractState {

  constructor() {
    super(VASTProcessorInitializationState.STATE_NAME);
  }

  run(context) {
    super.run(context);

    const query = context.query;

    // @TODO: this log should be deprecated
    //        it duplicates information in api:VastResponse, api:VastRedirect
    this._logDebug('Original query', {
      state: 'OriginalQuery',
      url: context.originalUrl,
    });

    // TODO: Consider to rename the clientId as konduitId so that we have a single name for the param
    const clientId = query[konduitParams.KONDUIT_ID];

    if (isValidClientId(clientId)) {
      context.clientId = clientId; // eslint-disable-line
      this._logInfo('Valid clientId', {
        state: 'ValidClientId',
        clientId,
      });
    } else {
      this._logError('Invalid clientId', {
        state: 'InvalidClientId',
        clientId,
      });
      context.finishWithError(400, 'Some of the provided parameters are not valid.');
      return;
    }

    const konduitAbTesting = query[konduitParams.KONDUIT_AB_TESTING];
    if (konduitAbTesting) {
      context.konduitAbTesting = konduitAbTesting;  // eslint-disable-line
    }

    // @NOTE: special case for Pluto TV client (OTT traffic)
    //        process all Ads in AdPod to gain maximum VPAID profit
    // @FIXME: We'll need to restrict numberOfAdsToProcess to something like 20
    //         This is a potential security breach
    if (context.isOttRequest) {
      context.numberOfAdsToProcess = maximumAllowedAdPodSize; // eslint-disable-line
      context.konduitAbTesting = '0'; // eslint-disable-line
    }

    const konduitAutoplay = query[konduitParams.KONDUIT_AUTOPLAY];
    if (konduitAutoplay) {
      context.konduitAutoplay = konduitAutoplay;  // eslint-disable-line
    }

    const vastUrl = query.origVast || queryToVastUrl(query);

    if (CLIENT_WO_ID === context.clientId && !query.ci) {
      metrics.vastOutlier(context, {
        [metrics.RESERVED_TAGS.SCOPE]: 'no-wo-ci-parameter',
      });
    }

    if (isValidUrl(vastUrl)) {
      this._logInfo('VAST tag to process', {
        state: 'ValidURL',
        vastVendor: mapUrlToVendorName(vastUrl),
        vastUrl,
        konduitAutoplay,
      });

      context.initialVastUrl = context.initialVastUrl || vastUrl; // eslint-disable-line
      context.currentVastUrl = vastUrl; // eslint-disable-line

      initialStrategies.forEach((strategy) => {
        strategy.handle(context, loggerSerice);
      });

      context.setState(new VASTProcessorLoadingState());
    } else if (isValidDataUrl(vastUrl)) {
      context.validDataUrl = true;

      this._logInfo('VAST tag to process', {
        state: 'ValidDataURL',
        vastVendor: mapUrlToVendorName(vastUrl),
        vastUrl,
        konduitAutoplay,
      });

      context.initialVastUrl = context.initialVastUrl || vastUrl;
      context.currentVastUrl = vastUrl;

      context.setState(new VASTProcessorLoadingState());
    } else {
      this._logError(`Invalid VAST tag URL: ${vastUrl}`, {
        state: 'InvalidURL',
        vastVendor: mapUrlToVendorName(vastUrl),
        vastUrl,
      });
      context.initialVastUrl = '';
      context.currentVastUrl = '';
      context.redirectToInitialVastUrl();
    }
  }

}

VASTProcessorInitializationState.STATE_NAME = '1:Init';

module.exports = VASTProcessorInitializationState;
