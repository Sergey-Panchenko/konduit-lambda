'use strict';

const libxmljs = require('libxmljs');
const _ = require('lodash');

const { AdUnitProcessingError } = require('../errors');

const contextPropertiesToFork = require('../constants/contextPropertiesToFork');
const getConfigParameter = require('../utils/getConfigParameter');
const AbstractState = require('./AbstractState');
const { buildResponseHeaders } = require('../utils/buildHeaders');
const collectFluentVastType = require('../utils/collectFluentVastType');

const requestTimeout = getConfigParameter('VAST_REQUEST_TIMEOUT');
const numberOfAdsToProcess = getConfigParameter('ADPOD_NUMBER_OF_ADS_TO_PROCESS');

const forkVastContext = context => Object.keys(context)
  .filter(key => contextPropertiesToFork[key])
  .reduce((fork, key) => {
    fork[key] = context[key]; // eslint-disable-line
    return fork;
  }, {});

const adReportFields = ['optimizationChain', 'vastVendorsChain', 'clickThroughUri',
  'vastUrlChain', 'vpaidVendor', 'konduitAbType', 'isWrapper', 'isVpaidOptimized',
  'isVpaidDetected', 'vpaidUrl', 'mediaUrl', 'content', 'successfulProcess',
  'creativeIds', 'creativeAdId', 'adId'];

/* eslint-disable no-param-reassign */
const syncContexts = (parentContext, childContext) => {
  parentContext.unwrapOperationsCount += childContext.unwrapOperationsCount;
  // wrapper flag could be met in both parent and child
  parentContext.isWrapper = childContext.isWrapper || parentContext.isWrapper;
  parentContext.isVpaidOptimized = childContext.isVpaidOptimized;
  parentContext.isNoAd = childContext.isNoAd;
  parentContext.hasMediaFile = childContext.hasMediaFile;

  // we keep adPosition starting from 1 for humanly-readable value
  const childAdPosition = childContext.adPosition - 1;
  const adReport = _.pick(childContext, adReportFields);
  adReport.content = collectFluentVastType(childContext).inlineContent;

  parentContext.adpodReports[childAdPosition] = adReport;

  return parentContext;
};

const normalizeAdReports = (context) => {
  const limit = context.adpodReports.length;
  for (let i = 0; i < limit; i += 1) {
    if (context.adpodReports[i] === undefined) {
      context.adpodReports[i] = [];
    }
  }
};
/* eslint-enable no-param-reassign */

class VASTProcessorAdPodProcessingState extends AbstractState {

  /**
   * Instance constructor
   * @param  {Sting} stateName -- title for logging purposes
   * @param  {Class} Processor -- internal VAST processor class (DI)
   */
  constructor(stateName, Processor) {
    super(stateName || VASTProcessorAdPodProcessingState.STATE_NAME);
    this.InternalProcessor = Processor;
    this.adWithErrors = 0;
  }

  createChildProcessor(context) {
    return new Promise((resolve, reject) => {
      const childProcessor = new this.InternalProcessor(context, { timeout: requestTimeout });
      childProcessor.on(this.InternalProcessor.EVENT_SUCCESS, (error, vastContext) => resolve(vastContext));
      childProcessor.on(this.InternalProcessor.EVENT_ERROR, (error, vastContext) => {
        const adpodError = new AdUnitProcessingError(error, vastContext);
        return reject(adpodError);
      });
      childProcessor.start();
    });
  }

  run(context) {
    super.run(context);

    this.adPod = context.xmlDoc.find('.//Ad');

    Promise.all(this.adPod.map((ad, index) => {
      const adUnit = ad.clone();

      const maxNumberOfAdsToProcess = context.numberOfAdsToProcess || numberOfAdsToProcess;

      if (index >= maxNumberOfAdsToProcess) {
        return Promise.resolve(adUnit);
      }
      const childContext = forkVastContext(context);
      childContext.xmlDoc = adUnit;
      childContext.destroyOnRequest = true;
      childContext.isInternalProcessor = true;
      childContext.adPosition = index + 1;

      return new Promise((resolve, reject) => {
        this.createChildProcessor(childContext)
          .then(this._onChildProcessorSuccess.bind(this))
          .then(resolve)
          .catch((error) => {
            // do not alert internal processor controlled redirect
            if (error.reason !== 302) {
              this._logError('AdPod processing failed', {
                state: 'AdPodError',
                error,
              });
            } else {
              this.adWithErrors += 1;
              if (this.adWithErrors === maxNumberOfAdsToProcess) {
                reject();
                return;
              }
            }

            if (error.adUnitContext) {
              // eslint-disable-next-line no-param-reassign
              context = syncContexts(context, error.adUnitContext);
              error.adUnitContext.destroy();
            }
            resolve(adUnit);
          });
      });
    }))
    .then(this.replaceAdpod.bind(this))
    .then(() => normalizeAdReports(this._context))
    .then(() => {
      // @TODO: consider tracking processed AdPod metric here
      context.successfulFinish();
    })
    .catch((error) => {
      this._logError('Unexpected AdPod processing error', {
        state: 'AdPodError',
        error,
      });
      context.redirectToInitialVastUrl();
    });
  }

  _onChildProcessorSuccess(adContext) {
    let context = this._context;
    context = syncContexts(context, adContext);

    if (adContext.isEmptyContent) {
      return null;
    }

    return Promise.resolve(adContext.vastBody)
      .then(libxmljs.parseXmlAsync)
      .then((xmlDoc) => {
        const childHeaders = adContext.responseHeaders || {};
        context.lastResponseHeaders = buildResponseHeaders(childHeaders);

        if (childHeaders['set-cookie']) {
          context.addSetCookie(childHeaders['set-cookie']);
        }

        const result = xmlDoc.get('//Ad').clone();
        adContext.destroy();
        return result;
      });
  }

  replaceAdpod(adPod) {
    adPod.forEach((ad, index) => {
      if (!ad) return;
      this.adPod[index].replace(ad);
    });

    return Promise.resolve();
  }

}

VASTProcessorAdPodProcessingState.STATE_NAME = '10:AdPod';

module.exports = VASTProcessorAdPodProcessingState;
