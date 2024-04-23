'use strict';

/* eslint-disable no-param-reassign, no-case-declarations, global-require */

const AbstractState = require('./AbstractState');
const VASTProcessorAdPodProcessingState = require('./VASTProcessorAdPodProcessingState');
const VASTProcessorAbTestState = require('./VASTProcessorAbTestState');
const VASTProcessorUnwrapState = require('./VASTProcessorUnwrapState');
const SpotXVastHandler = require('../vast-handlers/SpotXVastHandler');
const DoubleClickVastHandler = require('../vast-handlers/DoubleClickVastHandler');

const { mapUrlToVendorName } = require('../utils/mapUrlToVendorName');
const obtainCreativeIds = require('../utils/obtainCreativeIds');
const obtainAdId = require('../utils/obtainAdId');
const obtainCreativeAdId = require('../utils/obtainCreativeAdId');
const getMediaUrlBy = require('../utils/getMediaUrlBy');
const getConfigParameter = require('../utils/getConfigParameter');
const metrics = require('../utils/metrics');
const isInitialVastContext = require('../utils/isInitialVastContext');
const getVastTagVersion = require('../utils/getVastTagVersion');
const detectControlGroup = require('../utils/detectControlGroup');

const AD_TYPES = require('../constants/adTypes');

const AVAILABLE_AD_TYPES = new Set(Object.keys(AD_TYPES).map(k => AD_TYPES[k]));

const wrapperControlGroupSize = getConfigParameter('CONTROL_GROUP_WRAPPER_SIZE');


class VASTProcessorRoutingState extends AbstractState {
  constructor(stateName = VASTProcessorRoutingState.STATE_NAME) {
    super(stateName);
  }

  run(context) {
    super.run(context);

    // TODO: move out to `context.currentVastVendor`
    const vastVendor = mapUrlToVendorName(context.currentVastUrl || context.vastUrl);
    let vastVersion = getVastTagVersion(context.xmlDoc);

    let [type, content] = VASTProcessorRoutingState.detectAdType(context.xmlDoc);

    const creativeElement = context.xmlDoc.get('//Creative');
    const adElement = context.xmlDoc.get('//Ad');

    if (context.isInternalProcessor || (type !== AD_TYPES.ADPOD)) {
      context.creativeIds = obtainCreativeIds(creativeElement);
      context.adId = obtainAdId(adElement);
      context.creativeAdId = obtainCreativeAdId(creativeElement);
    }

    if (type !== AD_TYPES.ADPOD) {
      const doubleClickVastHandler = new DoubleClickVastHandler(context);
      if (doubleClickVastHandler.canHandleVastTag()) {
        context.xmlDoc = doubleClickVastHandler.generateVastDocument();
        [type, content] = VASTProcessorRoutingState.detectAdType(context.xmlDoc);
        vastVersion = getVastTagVersion(context.xmlDoc);
        metrics.vastOutlier(context, {
          [metrics.RESERVED_TAGS.SCOPE]: 'partial-doubleclick-handler',
        });
      }
    }

    if (isInitialVastContext(context)) {
      const initialAdType = AVAILABLE_AD_TYPES.has(type) ? type : null;
      context.initialAdType = initialAdType;
    }

    if (vastVersion) {
      context.vastVersionsChain.push(parseFloat(vastVersion));
    }

    switch (type) {
      case AD_TYPES.ADPOD:
        this._logInfo('Ad Pod found (multiple Ad tags)', {
          state: 'AdPodFound',
          adPodCount: content.length,
          vastVendor,
        });

        context.isAdPod = true;
        context.optimizationChain.push('adpod');

        context.setState(new VASTProcessorAdPodProcessingState(null, require('./VASTProcessor')));
        break;
      case AD_TYPES.INLINE:
        const mediaFile = content;
        context.hasMediaFile = true;
        // @FIXME We cannot trust data that came to us without prior validation
        // TODO: move out vpaid check to ValidationState
        if (VASTProcessorRoutingState.checkNoVpaid(mediaFile)) {
          this._logInfo('No VPAID unit to process', {
            state: 'NoVpaid',
            vastVendor,
          });

          context.optimizationChain.push('video');

          if (context.isWrapper) {
            const abTestState = new VASTProcessorAbTestState(context);
            const isWrapperControlGroup = Math.random() < wrapperControlGroupSize;
            // eslint-disable-next-line no-underscore-dangle
            if (abTestState._isAbTestingEnabled() && isWrapperControlGroup) {
              abTestState.applyAbTestPixelsForWrapper();
            } else {
              metrics.vastRequest(context, { status: 'processed', type: 'wrapper' });
              metrics.vastCreative(context, { status: 'processed', type: 'wrapper' });
            }
          } else {
            metrics.vastRequest(context, { status: 'passed_as_is', type: 'no_vpaid' });
            metrics.vastCreative(context, { status: 'passed_as_is', type: 'no_vpaid' });
          }

          context.mediaUrl = getMediaUrlBy(mediaFile, []);
          context.successfulFinish();
          return;
        }

        context.optimizationChain.push('vpaid');
        context.isVpaidDetected = true;

        const vpaidUrl = getMediaUrlBy(mediaFile, []);
        context.vpaidUrl = vpaidUrl;
        context.vpaidVendor = mapUrlToVendorName(vpaidUrl);

        const typeAttr = mediaFile.getAttribute('type');
        const vpaidType = typeAttr && typeAttr.value();

        // NOTE: VPAID special case for SpotX clients ("Daily Mail" and "Pluto")
        const vastHandler = new SpotXVastHandler(context);
        if (vastHandler && vastHandler.canHandleVastTag()) {
          this._logInfo('SpotX tag special processing', {
            state: 'SpotXVpaidFound',
            vastVendor,
            vpaidType,
            vpaidUrl,
            vpaidVendor: context.vpaidVendor,
          });

          context.xmlDoc = vastHandler.generateVastDocument();

          const vastType = 'vpaid';
          metrics.vastRequest(context, { status: 'processed', type: vastType });
          metrics.vastCreative(context, { status: 'processed', type: vastType });
          if (context.isOttRequest) {
            metrics.vastCreativeOtt(context, {
              action: 'replace-vpaid',
              type: vastType,
              vendor: context.vpaidVendor,
              vpaid_vendor: context.vpaidVendor, // @TODO: vendor will be replaced by vpaid_vendor in 1 month
            });
          }

          context.successfulFinish();
          return;
        }

        // NOTE: Common VPAID processing
        this._logInfo('VPAID found', {
          state: 'VpaidFound',
          vastVendor,
          vpaidType,
          vpaidUrl,
          vpaidVendor: context.vpaidVendor,
        });

        if (context.tracking) {
          context.mediaFilesStack.push(mediaFile.clone());
        }
        // process media file via electron or take the result from cache
        context.mediaFile = mediaFile;

        metrics.vastRequest(context, { status: 'passed_as_is', type: detectControlGroup(context) });
        metrics.vastCreative(context, { status: 'passed_as_is' });
        context.successfulFinish();

        break;
      case AD_TYPES.WRAPPER:
        const wrapper = content;

        this._logInfo('Wrapper found', {
          state: 'WrapperFound',
          vastVendor,
        });

        context.wrappersChain.push(context.xmlDoc);
        context.wrapper = wrapper;
        context.isWrapper = true;
        context.optimizationChain.push('wrapper');
        context.setState(new VASTProcessorUnwrapState());
        break;
      default:
        this._logWarning('No unit to process', {
          state: 'NoUnitFound',
          vastVendor,
        });

        context.optimizationChain.push('none');

        // @note: we should redirect in case user can get some Ad himself
        metrics.vastRequest(context, { status: 'invalid' });
        metrics.vastCreative(context, { status: 'invalid' });
        metrics.vastRedirectRequest(context, { type: 'invalid', vendor: vastVendor });
        context.redirectToInitialVastUrl();
    }
  }

  static checkNoVpaid(mediaFile) {
    const apiFramework = mediaFile.getAttribute('apiFramework');

    return !apiFramework || apiFramework.value().toLowerCase() !== 'vpaid';
  }

  static detectAdType(xmlDoc) {
    const adPods = xmlDoc.find('.//Ad');

    if (adPods.length > 1) {
      return [AD_TYPES.ADPOD, adPods];
    }

    const mediaFile = xmlDoc.get('.//MediaFile');

    if (mediaFile && mediaFile.text()) {
      return [AD_TYPES.INLINE, mediaFile];
    }

    const wrapper = xmlDoc.get('.//Wrapper');

    if (wrapper) {
      return [AD_TYPES.WRAPPER, wrapper];
    }

    return [];
  }
}

VASTProcessorRoutingState.STATE_NAME = '5:Routing';

module.exports = VASTProcessorRoutingState;
