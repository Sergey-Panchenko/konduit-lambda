'use strict';

const _ = require('lodash');
const libxml = require('libxmljs');

const Strategy = require('../Strategy');
const HandlerReport = require('../HandlerReport');
const PixelUrl = require('../../tracking/PixelUrl');
const vastUpdateAdParameters = require('../../utils/vastUpdateAdParameters');
const xmlAddFirstChild = require('../../utils/xmlAddFirstChild');
const createVastElement = require('../../utils/createVastElement');
const getConfigParameter = require('../../utils/getConfigParameter');
const { mapUrlToVendorTagValue } = require('../../utils/mapUrlToVendorName');
const detectControlGroup = require('../../utils/detectControlGroup');
const selectLargestDimension = require('../../utils/selectLargestDimension');
const isMobilePlatformRequest = require('../../utils/isMobilePlatformRequest');

const konduitParams = require('../../constants/konduitParams');
const { CLIENT_WO_ID } = require('../../constants/clientIds');

const KONDUIT_VPAID_WRAPPER_MEDIA_ID = 'vpaid-wrapper';
const vpaidWrapperUrl = getConfigParameter('VPAID_WRAPPER_URL');
const pixelTrackerBaseUrl = getConfigParameter('PIXEL_TRACKER_BASE_URL');

const jsMediaFileRegExp = /application\/javascript/i;

const isJSMediaFile = (mediaFile) => {
  const type = mediaFile.getAttribute('type');
  if (!type) return false;

  return jsMediaFileRegExp.test(type.value().toLowerCase().trim());
};

const isVPAIDMediaFile = (mediaFile) => {
  const apiFramework = mediaFile.getAttribute('apiFramework');
  if (!apiFramework) return false;

  return apiFramework.value().toLowerCase() === 'vpaid';
};

const composePagespeedParams = (query, requestId) => {
  const pagespeedParams = {};
  const konduitParamNames = Object.keys(konduitParams).map(key => konduitParams[key].toLowerCase());

  Object.keys(query)
    .forEach((queryParamName) => {
      const isKnownParam = konduitParamNames.indexOf(queryParamName.toLowerCase()) >= 0;
      if (queryParamName && !isKnownParam) {
        pagespeedParams[queryParamName] = query[queryParamName];
      }
    });

  delete pagespeedParams.wr_mt;
  pagespeedParams.oz_flash_id = requestId;

  return pagespeedParams;
};

const obtainSkipOffset = (linearElement) => {
  if (!linearElement) {
    return null;
  }

  const skipoffsetAttr = linearElement.getAttribute('skipoffset');
  const skipoffsetValue = skipoffsetAttr && skipoffsetAttr.value();

  return skipoffsetValue || null;
};

const serializeMediaFileElement = (mediaFile) => {
  const mediaFileAttributes = {
    width: mediaFile.getAttribute('width'),
    height: mediaFile.getAttribute('height'),
    type: mediaFile.getAttribute('type'),
    apiFramework: mediaFile.getAttribute('apiFramework'),
  };

  return _(mediaFileAttributes)
    .pickBy(_.identity)
    .mapValues(attr => attr.value())
    .assign({
      url: _.trim(mediaFile.text()),
    })
    .value();
};

const createVpaidEventTrackingUrl = (context) => {
  const currentVastVendor = mapUrlToVendorTagValue(context.currentVastUrl);
  const vastType = detectControlGroup(context);

  const vpaidEventTrackingUrl = new PixelUrl({
    host: pixelTrackerBaseUrl,
    encode: true,
    excludeEncoding: ['t', 'cb', 'd'],
    path: '/event-vpaid',
    parameters: {
      cid: context.clientId,
      rid: context.requestId,
      apos: context.adPosition,
      clr: context.allowLogs,
      vt: vastType,
      cvvnd: currentVastVendor,
      vpvnd: context.vpaidVendor || 'none',
      wr_mt: context.query.wr_mt,
      ci: context.query.ci,
      ts: Date.now(),
      t: '[EVENT]',
      cb: '[CACHEBUSTING]',
      d: '[DATA]',
    },
  });

  return vpaidEventTrackingUrl.toString();
};

const removeSkipOffsetAttribute = (linearElement) => {
  if (!linearElement) {
    return;
  }

  const skipoffsetAttr = linearElement.getAttribute('skipoffset');
  if (skipoffsetAttr) {
    skipoffsetAttr.remove();
  }
};

const handler = (context) => {
  const { xmlDoc, query, requestId } = context;
  const documentContext = (xmlDoc instanceof libxml.Element) ? xmlDoc.doc() : xmlDoc;
  const wrapperFiltering = query.wr_mt;

  const originalAdParameters = xmlDoc.get('.//AdParameters');
  const linearElement = xmlDoc.get('.//Linear');
  const skipOffset = obtainSkipOffset(linearElement);

  const serializedMediaFiles = _.map(xmlDoc.find('.//MediaFile'), serializeMediaFileElement);

  if (wrapperFiltering === 1) {
    xmlDoc.find('.//MediaFile')
      .forEach(mediaFile => isJSMediaFile(mediaFile) && mediaFile.remove());

    xmlDoc.find('.//AdParameters')
      .forEach(adParameters => adParameters.remove());

    return HandlerReport.makeSuccessful({});
  }

  if (wrapperFiltering === 2) {
    xmlDoc.find('.//MediaFile')
      .forEach(mediaFile => mediaFile.remove());
    removeSkipOffsetAttribute(linearElement);
  }

  if (wrapperFiltering === 3) {
    xmlDoc.find('.//MediaFile')
      .forEach(mediaFile => isVPAIDMediaFile(mediaFile) && mediaFile.remove());
    removeSkipOffsetAttribute(linearElement);
  }

  const wrapperAdParameters = {
    adParameters: originalAdParameters ? encodeURIComponent(originalAdParameters.text()) : undefined,
    trackingUrl: createVpaidEventTrackingUrl(context),
    mediaFiles: serializedMediaFiles,
    safeIframe: false,
    trackingLevel: 'debug',
    p: {
      ...composePagespeedParams(query, requestId),
    },
  };

  if (skipOffset) {
    wrapperAdParameters.skipOffset = skipOffset;
  }
  if (query.debug) {
    wrapperAdParameters.debug = query.debug;
  }

  vastUpdateAdParameters(xmlDoc, JSON.stringify(wrapperAdParameters));

  const mediaFilesHost = xmlDoc.get('.//MediaFiles');

  if (!mediaFilesHost) {
    return HandlerReport.makeFailed({
      message: 'No media file host found',
    });
  }

  const isVpaidWrapperPresent = !!xmlDoc.get(`.//MediaFile[@id='${KONDUIT_VPAID_WRAPPER_MEDIA_ID}']`);


  const encodedTrackingUrl = encodeURIComponent(wrapperAdParameters.trackingUrl);
  const encodedPagespeedParameters = encodeURIComponent(JSON.stringify(wrapperAdParameters.p));

  if (!isVpaidWrapperPresent) {
    const { width, height } = selectLargestDimension(wrapperAdParameters.mediaFiles, { width: 16, height: 9 });
    const vpaidWrapperElement = createVastElement(
      documentContext,
      'MediaFile',
      `${vpaidWrapperUrl}?${encodedTrackingUrl}&${encodedPagespeedParameters}`,
      {
        id: KONDUIT_VPAID_WRAPPER_MEDIA_ID,
        delivery: 'progressive',
        apiFramework: 'VPAID',
        type: 'application/javascript',
        width,
        height,
      }
    );

    xmlAddFirstChild(mediaFilesHost, vpaidWrapperElement);
  }

  return HandlerReport.makeSuccessful({ wrapped: true });
};

const isActual = (context) => {
  const isTargetClient = context.clientId === CLIENT_WO_ID;

  if (!isTargetClient) {
    return false;
  }

  const hasCiParameter = !!context.query.ci;

  if (!hasCiParameter) {
    return false;
  }

  if (isMobilePlatformRequest(context)) {
    return false;
  }

  return !!context.xmlDoc.get('.//MediaFiles');
};

const clientWoVpaidWrappingStrategy = new Strategy({ isActual, handler });

module.exports = clientWoVpaidWrappingStrategy;
