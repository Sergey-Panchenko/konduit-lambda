'use strict';

const libxml = require('libxmljs');

const cookies = require('../utils/cookies');

const EventEmittingContext = require('./EventEmittingContext');
const VASTProcessorInitializationState = require('./VASTProcessorInitializationState');
const VASTProcessorRoutingState = require('./VASTProcessorRoutingState');
const ABTestType = require('../constants/ABTestType');
const { mergeImpressionsTo } = require('../utils/merge/mergeImpressionsTo');
const { mergeTrackingEventsTo } = require('../utils/merge/mergeTrackingEventsTo');
const { mergeVideoClicksTo } = require('../utils/merge/mergeVideoClicksTo');
const { mergeExtensionsTo } = require('../utils/merge/mergeExtensionsTo');
const { mergeOuterExtensionsTo } = require('../utils/merge/mergeOuterExtensionsTo');
const { mergeAttemptsTo } = require('../utils/merge/mergeAttemptsTo');
const { mergeNonLinearAds } = require('../utils/merge/mergeNonLinearAds');
const { mergeCompanionAds } = require('../utils/merge/mergeCompanionAds');
const vastInjectVideoClick = require('../utils/vastInjectVideoClick');
const createVastElement = require('../utils/createVastElement');
const TrackingEvent = require('../tracking/TrackingEvent');
const filterAdUnits = require('../utils/filterAdUnits');
const shouldCleanUpAdForOtt = require('../utils/shouldCleanUpAdForOtt');
const injectKonduitErrorTag = require('../utils/injectKonduitErrorTag');
const createTrackingEventsCollection = require('../utils/createTrackingEventsCollection');
const getVastTagVersion = require('../utils/getVastTagVersion');
const createEmptyVastBody = require('../utils/createEmptyVastBody');
const detectClickThroughURI = require('../utils/detectClickThroughURI');
const vastInjectImpression = require('../utils/vastInjectImpression');
const metrics = require('../utils/metrics');
const getConfigParameter = require('../utils/getConfigParameter');
const updateVastVersion = require('../utils/updateVastVersion');

const NullLogger = require('../utils/NullLogger');
const StateLoggerAdapter = require('../utils/StateLoggerAdapter');

const {
  // clientWoVpaidWrappingStrategy,
  clientWoAdVerificationStrategy,
  vastWrappingStrategy,
} = require('../strategies');

const maximumAllowedAdPodSize = getConfigParameter('ADPOD_MAXIMUM_ADS_TO_PROCESS');


class VASTProcessor extends EventEmittingContext {

  constructor(context) {
    super();
    this.wrappersChain = [];
    this.mediaFilesStack = [];
    this.collectedSetCookieHeaders = context.initialResponseCookies || [];
    this.optimizationChain = [];
    this.adpodReports = [];
    this.vastUrlChain = [];
    this.vastVendorsChain = [];
    this.vastVersionsChain = [];

    Object.assign(this, context);
    if (this.isInternalProcessor) {
      this.currentVastUrl = this.vastUrl;
      this.setState(new VASTProcessorRoutingState(), true);
      // return this;
      return;
    }
    this.setState(new VASTProcessorInitializationState(), true);
    // NOTE: backward compatibility
    this.kid = this.requestId;
    this.startTime = process.hrtime();
    this.responseHeaders = {
      'content-type': 'text/xml; charset=utf-8',
    };
    this.responseData = '';
    this.initialVastUrl = null;
    this.nestingLevel = 0;
    this.lastResponseHeaders = {};
    if (!this.tracking) {
      this.tracking = false;
    }
    this.isProcessingFinished = false;
    this.unwrapOperationsCount = 0;
    this.adPosition = 0;
  }

  // @TODO: consider to move out and make a @predefinedResponses util
  customResponse(statusCode, headers, bodyBuffer) {
    if (this.responseSent) {
      return;
    }
    this.headers = Object.assign(this.headers || {}, headers);
    this.vastBody = bodyBuffer.toString('utf8');
    this.emitSuccess();
    this.responseSent = true;

    this.finish();
  }

  /**
   * Add Cookie to context
   * Max-Age have precedence
   *
   * @param {string[]} plainCookies
   */
  addSetCookie(plainCookies) {
    const newCookies = plainCookies.map(cookies.parseSetCookie).reduce((acc, cookie) => {
      if ((cookie.maxAge !== null) ? cookie.maxAge > 0 : cookie.expires > Date.now()) {
        acc[cookie.key] = cookie.value;
      }

      return acc;
    }, {});

    Object.assign(this.cookies, newCookies);
    this.collectedSetCookieHeaders.push(...plainCookies);
  }

  finishWithError(status, message) {
    if (!this.isFinished()) {
      status = status || 500;// eslint-disable-line
      message = message || 'Something went wrong';// eslint-disable-line

      // @TODO: there is no direct access to the logger here
      if (this.currentState) {
        // eslint-disable-next-line no-underscore-dangle
        this.currentState._logError(message, {
          state: 'Error',
          responseCode: status,
        });
      }

      this.errorMessage = message;
      this.emitError(status);
    }

    this.finish();
  }

  successfulFinish() {
    this.successfulProcess = true;
    if (this.isOttRequest && (this.isInternalProcessor || !this.isAdPod)) {
      metrics.vastCreativeOtt(this, { action: 'pass-ok' });
    }

    this.sendResponse();
    this.finish();
  }

  setFirstVASTResponse(response, body) {
    if (!this._firstVASTResponse) {
      this._firstVASTResponse = response;
      this._firstVASTBody = body;
    }
  }

  forwardFirstVASTResponse() {
    const isApplied = this.applyWrappingStrategy();
    if (isApplied) {
      this.sendCustomResponse(this.xmlDoc.toString());
    } else {
      this.forwardResponse(this._firstVASTResponse, this._firstVASTBody);
    }
  }

  applyWrappingStrategy() {
    const [vastWrappingResult] = [vastWrappingStrategy]
      .map(strategy => strategy.handle(this));

    this.vastWrapperApplied = vastWrappingResult.isSuccessful;

    return vastWrappingResult.isSuccessful;
  }

  /**
   * Will respond with 302 Redirect header and initialUrl
   */
  redirectToInitialVastUrl() {
    if (this.isFinished()) {
      return;
    }
    const isApplied = this.applyWrappingStrategy();
    if (isApplied) {
      if (this.isInternalProcessor) {
        this.emitError(302);
        return;
      }
      injectKonduitErrorTag(this.xmlDoc, this);
      if (!this.trackingEventCollection) {
        this.trackingEventCollection = createTrackingEventsCollection(this);
      }
      this.xmlDoc = this._abTestingPatchXmlResult();
      this.sendCustomResponse(this.xmlDoc.toString());
      return;
    }

    // @NOTE: do not redirect any response to ott devices
    //        send empty VAST instead
    if (this.isOttRequest) {
      metrics.vastCreativeOtt(this, { action: 'cleanup' });
      if (this.isInternalProcessor) {
        this.redirectResponse(this.initialVastUrl);
      } else {
        this.optimizationChain.push('_ott_empty');
        this.sendEmptyVastResponse();
      }
    } else {
      this.redirectResponse(this.initialVastUrl);
    }
  }

  /**
   * Will respond with 302 Redirect header
   * @param  {String} url -- address to follow
   */
  redirectResponse(url) {
    if (this.isFinished()) {
      return;
    }

    // @TODO: there is no direct access to the logger here
    if (this.currentState) {
      // eslint-disable-next-line no-underscore-dangle
      this.currentState._logInfo('Redirect response', {
        state: 'RedirectResponse',
        url,
      });
    }

    // @todo: We always redirect to an initial VAST url. Check if we need support of custom url
    this.emitError(302);

    this.finish();
  }

  forwardResponse(fromResponse, body) {
    if (this.isFinished()) {
      return;
    }

    // @TODO: there is no direct access to the logger here
    if (this.currentState) {
      // eslint-disable-next-line no-underscore-dangle
      this.currentState._logInfo('Forward response', {
        state: 'ForwardResponse',
        rawHeaders: JSON.stringify(fromResponse.headers),
        body,
      });
    }

    const headers = fromResponse.headers;

    // NOTE: We are returning GZIP encoding while the body is plain
    headers['content-encoding'] = 'identity';
    headers['transfer-encoding'] = 'identity';
    delete headers['content-length'];

    this.responseHeaders = Object.assign({},
      headers,
      {
        'set-cookie': this.collectedSetCookieHeaders,
      },
    );
    this.vastBody = body;
    this.emitSuccess();

    this.finish();
  }

  sendEmptyVastResponse() {
    this.isEmptyContent = true;
    const vastVersion = getVastTagVersion(this.xmlDoc);
    const body = createEmptyVastBody(vastVersion);

    return this.sendCustomResponse(body);
  }

  sendCustomResponse(body) {
    if (this.isFinished() || this.responseSent) {
      return;
    }
    this.responseSent = true;
    this.vastBody = body;

    // @TODO: there is no direct access to the logger here
    if (this.currentState) {
      // eslint-disable-next-line no-underscore-dangle
      this.currentState._logInfo('VAST resulting XML', {
        state: 'VastSuccess',
        body: this.vastBody,
      });
    }

    this.emitSuccess();
  }

  collectElementsFromWrappersChain() {
    [].concat(this.wrappersChain).reverse().forEach((wrapperXmlDoc) => {
      this.xmlDoc = mergeTrackingEventsTo(this.xmlDoc, wrapperXmlDoc);
      this.xmlDoc = mergeVideoClicksTo(this.xmlDoc, wrapperXmlDoc);
      this.xmlDoc = mergeExtensionsTo(this.xmlDoc, wrapperXmlDoc);
      this.xmlDoc = mergeOuterExtensionsTo(this.xmlDoc, wrapperXmlDoc);
      this.xmlDoc = mergeAttemptsTo(this.xmlDoc, wrapperXmlDoc);
      this.xmlDoc = mergeNonLinearAds(this.xmlDoc, wrapperXmlDoc);
      this.xmlDoc = mergeCompanionAds(this.xmlDoc, wrapperXmlDoc);
    });

    return this.xmlDoc;
  }

  getStateLogger() {
    return this.currentState
      ? new StateLoggerAdapter(this.currentState)
      : new NullLogger();
  }

  applyVastResponseStrategies() {
    const logger = this.getStateLogger();
    [/* VAST post-processing */].forEach(strategy => strategy.handle(this, logger));
  }

  applyCustomStrategies() {
    [
      // NOTE: VPAID wrapper is temporarily disabled
      // clientWoVpaidWrappingStrategy,
      clientWoAdVerificationStrategy,
    ].forEach(strategy => strategy.handle(this));
  }

  // TODO: The method is not testable, input and output is not clear, result is not used
  updateVastVersionOption() {
    if (this.vastVersionsChain.length > 1) {
      const maxLoadedVersion = Math.max(...this.vastVersionsChain);
      updateVastVersion(this.xmlDoc, maxLoadedVersion.toFixed(1));
    }

    return this.xmlDoc;
  }

  // TODO: The method should be refactored into smaller/clear methods
  sendResponse() {
    if (this.isFinished() || this.responseSent) {
      return;
    }
    this.responseSent = true;
    this.clickThroughUri = detectClickThroughURI(this.xmlDoc);
    this.xmlDoc = this.collectElementsFromWrappersChain();

    // NOTE: create non-AB tracking events collection for all tags
    //       if AB pixels are not added yet
    if (!this.trackingEventCollection && (this.isInternalProcessor || !this.isAdPod)) {
      console.log('!! createTrackingEventsCollection');
      this.trackingEventCollection = createTrackingEventsCollection(this);
    }

    console.log('!! sendResponse.trackingEventCollection', this.trackingEventCollection);


    // @TODO Move AB testing logic to another end state
    this.xmlDoc = this._abTestingPatchXmlResult();
    let responseData;
    if (this.xmlDoc) {
      if (!this.isAdPod || this.isInternalProcessor) {
        injectKonduitErrorTag(this.xmlDoc, this);
        this.applyCustomStrategies();
      }
      if (!this.isInternalProcessor) {
        this.updateVastVersionOption();
        this.applyVastResponseStrategies();
      }
      responseData = this.xmlDoc.toString();
    } else {
      responseData = this.currentTextResult;
    }

    if (!this.isInternalProcessor && this.isOttRequest) {
      const ottXmlDoc = filterAdUnits(this.xmlDoc, (adUnit, adIndex) => {
        if (adIndex >= maximumAllowedAdPodSize) return false;

        if (shouldCleanUpAdForOtt(this, adUnit, adIndex)) {
          const targetOptimizationChain = this.isAdPod ?
            this.adpodReports[adIndex].optimizationChain : this.optimizationChain;
          targetOptimizationChain.push('_ott_empty');

          return false;
        }
        return true;
      });
      this.vastBody = ottXmlDoc.toString();
    } else {
      this.responseHeaders = Object.assign({},
        this.lastResponseHeaders,
        {
          'set-cookie': this.collectedSetCookieHeaders,
        },
        this.responseHeaders
      );
      this.vastBody = responseData;
    }

    // @TODO: there is no direct access to the logger here
    if (this.currentState) {
      // eslint-disable-next-line no-underscore-dangle
      this.currentState._logInfo('VAST resulting XML', {
        state: 'VastSuccess',
        body: this.vastBody,
      });
    }

    this.emitSuccess();
  }

  _abTestingPatchXmlResult() {
    let currentDocXml = this.xmlDoc;
    const documentContext = (currentDocXml instanceof libxml.Element) ? currentDocXml.doc() : currentDocXml;

    if (this.trackingEventCollection) {
      if (this.konduitAutoplay) {
        this.trackingEventCollection.sharedData.ap = this.konduitAutoplay;
      }

      // @TODO: This is a bad practiсe to rely on a parameter set elsewhere
      // we need to move AB test instrument fully here if needed
      if (this.trackingEventCollection.sharedData.tt === ABTestType.ORIGINAL) {
        // @TODO: We should simply store initial vast
        if (this.wrappersChain.length && this.initialVastUrl) {
          currentDocXml = this.wrappersChain[0];
          this.currentVastUrl = this.initialVastUrl;
        }
      }

      const creativeInnerLinear = currentDocXml.get('.//Linear');
      if (creativeInnerLinear) {
        let trackingEvents = creativeInnerLinear.get('.//TrackingEvents');

        if (!trackingEvents) {
          trackingEvents = new libxml.Element(documentContext, 'TrackingEvents');
          creativeInnerLinear.addChild(trackingEvents);
        }

        // @TODO: consider to move to public method of TrackingEventCollection
        this.trackingEventCollection.sharedData.st = Date.now();
        this.trackingEventCollection.toXmlElement(documentContext).forEach((trackingElement) => {
          trackingEvents.addChild(trackingElement);
        });
      }

      if (this.trackingEventCollection.sharedData.tt !== ABTestType.ORIGINAL) {
        this._mergeImpressionsFromWrappers(currentDocXml);
      }

      let impressionBaseUrl = 'https://s.pixsrvcs.com/2/[client_id]/analytics.gif';
      impressionBaseUrl = impressionBaseUrl.replace('[client_id]', this.trackingEventCollection.sharedData.ci);
      const impressionUrl = TrackingEvent.create(
        TrackingEvent.IMPRESSION,
        impressionBaseUrl, // this.trackingEventCollection.pixelServerUrl,
        this.trackingEventCollection.sharedData
      ).getUrl();
      const impressionElement = new libxml.Element(documentContext, 'Impression');
      impressionElement.cdata(impressionUrl);

      this.addImpression(currentDocXml, impressionElement);

      const clickUrl = TrackingEvent.create(
        TrackingEvent.CLICK,
        this.trackingEventCollection.pixelServerUrl,
        this.trackingEventCollection.sharedData
      ).getUrl();
      const clickTrackingElement = createVastElement(
        currentDocXml,
        'ClickTracking',
        clickUrl
      );
      vastInjectVideoClick(currentDocXml, clickTrackingElement);
    } else {
      this._mergeImpressionsFromWrappers(currentDocXml);
    }

    return currentDocXml;
  }

  _mergeImpressionsFromWrappers(xmlDoc) {
    this.wrappersChain.reverse().forEach((wrapperXmlDoc) => {
      mergeImpressionsTo(xmlDoc, wrapperXmlDoc);
    });
  }

  // eslint-disable-next-line class-methods-use-this
  addImpression(doc, impressionElement) {
    return vastInjectImpression(doc, impressionElement);
  }

  destroy() {
    if (this.doNotDestroy) return;

    const stateStack = this.stateStack;

    if (stateStack) {
      let state;
      while (!stateStack.isEmpty()) {
        state = stateStack.pop();
        state.destroy();
      }
    }

    Object
      .keys(this)
      .forEach((property) => {
        this[property] = null;
      });
  }

  isFinished() {
    return !!this.isProcessingFinished;
  }

  finish() {
    super.finish();
    this.isProcessingFinished = true;
  }

  start() {
    return super.start()
      .catch((error) => {
        this.emitError(error);
      });
  }

}

module.exports = VASTProcessor;
