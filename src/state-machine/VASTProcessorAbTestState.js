'use strict';

const AbstractState = require('./AbstractState');
const ABTestType = require('../constants/ABTestType');
const TrackingEventCollection = require('../tracking/TrackingEventCollection');
const getConfigParameter = require('../utils/getConfigParameter');
const { mapUrlToVendorName, mapUrlToVendorTagValue } = require('../utils/mapUrlToVendorName');
const removeUrlParameters = require('../utils/removeUrlParameters');
const cacheBusterParamList = require('../constants/cacheBusterParamList');
const getHashBy = require('../utils/getHashBy');
const metrics = require('../utils/metrics');
const detectControlGroup = require('../utils/detectControlGroup');
const createTrackingEventsCollection = require('../utils/createTrackingEventsCollection');

const abTestingEnabled = getConfigParameter('AB_TESTING_ENABLED');
const abPixelServerUrl = getConfigParameter('PIXEL_TRACKER_EVENT_URL');

// @TODO: Make it an AbstractState like other state classes
class VASTProcessorAbTestState {

  constructor(context) {
    this._context = context;
  }

  applyAbTestPixelsForWrapper() {
    const context = this._context;
    const testType = VASTProcessorAbTestState.getABTestType(context);
    const vastHash = getHashBy(removeUrlParameters(context.currentVastUrl, cacheBusterParamList));
    const currentVastVendor = mapUrlToVendorTagValue(context.currentVastUrl);
    const vastType = detectControlGroup(context);

    context.trackingEventCollection = createTrackingEventsCollection(context);

    // context.trackingEventCollection = new TrackingEventCollection(abPixelServerUrl, {
    //   tt: testType,
    //   vh: vastHash,
    //   cid: context.clientId,
    //   cadid: context.creativeAdId,
    //   crids: context.creativeIds,
    //   adid: context.adId,
    //   vt: vastType,
    //   apos: context.adPosition,
    //   // @NOTE: event:start only properties
    //   rid: context.requestId,
    //   cvvnd: currentVastVendor,
    //   vpvnd: context.vpaidVendor || 'none',
    //   clr: context.allowLogs,
    // });

    // @todo: manually limit logging
    //        as far as state do not implement AbstractState
    if (context.allowLogs) {
      AbstractState.LOGGER.info('AB wrapper test',
        Object.assign({}, this._createContextLogFields(), {
          command: `${VASTProcessorAbTestState.STATE_NAME}.ABWrapperTest`,
          testType: testType === ABTestType.KONDUITED ? 'konduited' : 'original',
          initialVastUrl: context.initialVastUrl,
          vastVendor: mapUrlToVendorName(context.initialVastUrl),
          vastHash,
          wrapperUrl: context.currentVastUrl,
          wrapperVendor: mapUrlToVendorName(context.currentVastUrl),
        }));
    }

    switch (testType) {
      case ABTestType.KONDUITED:
        metrics.vastRequest(context, {
          status: 'processed',
          type: vastType,
          vendor: currentVastVendor,
        });
        metrics.vastCreative(context, {
          status: 'processed',
          type: vastType,
        });
        metrics.vastAbRequest(context, { ab: 'konduited' });
        break;
      case ABTestType.ORIGINAL:
        metrics.vastRequest(context, {
          status: 'passed_as_is',
          type: vastType,
          vendor: currentVastVendor,
        });
        metrics.vastCreative(context, {
          status: 'passed_as_is',
          type: vastType,
        });
        metrics.vastAbRequest(context, { ab: 'original' });
        break;
      default:
        AbstractState.LOGGER.error(`Unsupported AB test type: ${testType}`, {
          // state: 'InvalidABTestType',
          command: `${VASTProcessorAbTestState.STATE_NAME}.InvalidABTestType`,
        });
    }
  }

  _isAbTestingEnabled() {
    switch (this._context.konduitAbTesting) {
      case '1':
        return true;
      case '0':
        return false;
      default:
        return abTestingEnabled;
    }
  }

  _createContextLogFields() {
    const logFields = {
      requestId: this._context.kid,
      konduitId: this._context.clientId,
      completeLogRecord: this._context.allowLogs,
    };

    return logFields;
  }

  static getABTestType(context) {
    if (context.konduitAbType === null || context.konduitAbType === undefined) {
      const roll = Math.round(Math.random()) === 0;

      // eslint-disable-next-line no-param-reassign
      context.konduitAbType = roll ? ABTestType.KONDUITED : ABTestType.ORIGINAL;
    }
    return context.konduitAbType;
  }
}

VASTProcessorAbTestState.STATE_NAME = '11:ABTesting';

module.exports = VASTProcessorAbTestState;
