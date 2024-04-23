'use strict';

/* eslint max-lines-per-function: ["error", 70] */

const url = require('url');
const libxml = require('libxmljs');
const getConfigParameter = require('./getConfigParameter');
const detectControlGroup = require('./detectControlGroup');
const { mapUrlToVendorTagValue } = require('./mapUrlToVendorName');
const { wrapUrlAsPublic } = require('./publicUrlCrypto');

const errorTrackerUrl = getConfigParameter('PIXEL_TRACKER_ERROR_URL');

const purifyBool = value => value ? 1 : 0; // eslint-disable-line no-confusing-arrow

const injectKonduitErrorTag = (finalVast, context) => {
  const targetsHaystack = finalVast.find('.//InLine|.//Wrapper');
  const documentContext = (finalVast instanceof libxml.Element) ? finalVast.doc() : finalVast;

  targetsHaystack.forEach((tag) => {
    // NOTE: Current strategy is to add multiple Error elements persisting the original Error
    // let vendorErrorTracking = tag.get('Error');
    let vendorErrorTracking = false;
    const errorReportingQuery = {};

    if (vendorErrorTracking) {
      errorReportingQuery.url = vendorErrorTracking.text().trim();
    } else {
      vendorErrorTracking = new libxml.Element(documentContext, 'Error');

      const siblingNode = tag.get('Error') || tag.get('Impression');
      // const siblingNode = tag.get('Impression');

      if (siblingNode) {
        siblingNode.addPrevSibling(vendorErrorTracking);
      } else {
        // @TODO detect more siblings for Error tag
        tag.addChild(vendorErrorTracking);
      }
    }

    // TODO: Update with common Human query parameters
    // See createTrackingEventsCollection.js
    errorReportingQuery.ander = 'ander123';

    errorReportingQuery.reqid = context.requestId;
    errorReportingQuery.code = '___ERRORCODE___';
    errorReportingQuery.opt = purifyBool(!context.disableOptimization);
    errorReportingQuery.apos = context.adPosition;
    errorReportingQuery.clr = purifyBool(context.allowLogs);
    errorReportingQuery.cid = context.clientId;
    errorReportingQuery.crids = context.creativeIds;
    errorReportingQuery.cadid = context.creativeAdId;
    errorReportingQuery.adid = context.adId;
    errorReportingQuery.vtvnd = mapUrlToVendorTagValue(context.currentVastUrl);
    errorReportingQuery.vpvnd = context.vpaidVendor || 'none';
    errorReportingQuery.vt = detectControlGroup(context);
    errorReportingQuery.tt = context.konduitAbType;

    if (context.query) {
      if (context.query.ci) {
        errorReportingQuery.ci = context.query.ci;
      }
      if (context.query.wr_mt) {
        errorReportingQuery.wr_mt = context.query.wr_mt;
      }
    }

    // NOTE: OTT devices might not support a protocol-less URL (KME-1086)
    const errorURL = url.parse(context.isOttRequest ? `https:${errorTrackerUrl}` : errorTrackerUrl);
    errorURL.query = errorReportingQuery;

    const publicErrorUrl = wrapUrlAsPublic(errorURL);

    vendorErrorTracking.text('');
    vendorErrorTracking.cdata(url.format(publicErrorUrl).replace(/___(.+?)___/, '[$1]'));
  });
};

module.exports = injectKonduitErrorTag;
