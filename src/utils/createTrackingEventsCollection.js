'use strict';

const getConfigParameter = require('./getConfigParameter');
const getHashBy = require('./getHashBy');
const { mapUrlToVendorTagValue } = require('./mapUrlToVendorName');
const getVastTagVersion = require('./getVastTagVersion');
const removeUrlParameters = require('./removeUrlParameters');
const detectControlGroup = require('./detectControlGroup');

const cacheBusterParamList = require('../constants/cacheBusterParamList');
const TrackingEventCollection = require('../tracking/TrackingEventCollection');

const pixelTrackerEventUrl = getConfigParameter('PIXEL_TRACKER_EVENT_URL');

const createTrackingEventsCollection = (context, testType) => {
  const vastHash = getHashBy(removeUrlParameters(context.currentVastUrl, cacheBusterParamList));
  // const currentVastVendor = mapUrlToVendorTagValue(context.currentVastUrl);
  // const vastType = detectControlGroup(context);
  const vastVersion = getVastTagVersion(context.xmlDoc);

  const params = {
    dt: new Date().getTime(),
    ac: '%ebuy!',
    si: '%esid!',
    pc: '%epid!',
    pi: '%eaid!',
    cr: '%ecid!',
    dm: '%psz=!',
    ai: '%eadv!',
    ui: '%m',
    vs: vastHash,
    pp: '%s',
    vver: vastVersion,
    vsch: 'pre', // TODO: Should it be dynamic?
    _cb: '[CACHEBUSTING]',
  };

  if (context.query && context.query.ci) {
    params.ci = context.query.ci;
  }

  if (context.query && context.query.wr_mt) {
    params.wr_mt = context.query.wr_mt;
  }

  if (testType !== undefined) {
    params.tt = testType;
  }

  // NOTE: OTT devices might not support a protocol-less URL (KME-1086)
  const fullPixelTrackerEventUrl = context.isOttRequest ? `https:${pixelTrackerEventUrl}` : pixelTrackerEventUrl;

  console.log('!! TrackingEventCollection:', fullPixelTrackerEventUrl, params);

  return new TrackingEventCollection(fullPixelTrackerEventUrl, params);
};

module.exports = createTrackingEventsCollection;
