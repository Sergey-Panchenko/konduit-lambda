'use strict';

const libxml = require('libxmljs');
const entities = require('entities');

const createVastElement = require('../utils/createVastElement');

const DOUBLE_CLICK_URL_REGEXP = /doubleclick\.net/;

// TODO: The handler has a simple interface that can be covered with unit tests
class DoubleClickVastHandler {

  constructor(context) {
    this.context = context;
    const currentDocXml = this.context.xmlDoc;
    this.adParameters = this.fetchAdParameters(currentDocXml);
    this.documentContext = (currentDocXml instanceof libxml.Element) ? currentDocXml.doc() : currentDocXml;
    this.initialized = false;
  }

  /**
   * Check if the current tag can be handled by this class.
   *
   * @returns {boolean} true if can be handled and false otherwise
   */
  canHandleVastTag() {
    if (!(this.context.xmlDoc instanceof libxml.Document)) {
      return false;
    }

    if (this.context.isAdPod) {
      return false;
    }

    if (!this.adParameters) {
      return false;
    }

    if (!DOUBLE_CLICK_URL_REGEXP.test(this.context.currentVastUrl)) {
      return false;
    }

    let newXmlDoc;

    try {
      newXmlDoc = libxml.parseXml(this.adParameters);
    } catch (err) {} // eslint-disable-line no-empty

    if (!newXmlDoc) {
      return false;
    }

    this.newXmlDoc = newXmlDoc;

    this.initialized = true;

    return true;
  }

  /**
   * Generate a current tag using current execution context.
   *
   * @returns libxml document that can be assigned back to context.xmlDoc
   */
  generateVastDocument() {
    const currentDocXml = this.context.xmlDoc;
    let newDocXml = this.newXmlDoc;

    if (!this.initialized) {
      // TODO: Makes sense to throw an Error here
      return currentDocXml;
    }

    const impressions = this.fetchImpressions(currentDocXml);

    const trackingEvents = this.fetchTrackingEvents(currentDocXml);

    const videoClicks = this.fetchVideoClicks(currentDocXml);

    if (impressions && impressions.length) {
      newDocXml = this.injectImpressionElements(newDocXml, impressions);
    }
    if (trackingEvents && trackingEvents.length) {
      newDocXml = this.injectTrackingEventElements(newDocXml, trackingEvents);
    }
    if (videoClicks && videoClicks.length) {
      newDocXml = this.injectVideoClickElements(newDocXml, videoClicks);
    }

    return newDocXml;
  }

  // eslint-disable-next-line class-methods-use-this
  fetchAdParameters(currentDocXml) {
    const adParametersElement = currentDocXml.get && currentDocXml.get('.//AdParameters');

    let result = '';
    if (adParametersElement && adParametersElement.text()) {
      const adParametersString = adParametersElement.text();

      try {
        result = entities.decodeXML(adParametersString);
      } catch (e) {
        result = '';
      }
    }

    return result;
  }

  // eslint-disable-next-line class-methods-use-this
  fetchImpressions(xmlDoc) {
    return xmlDoc
      .find('.//Impression');
  }

  // eslint-disable-next-line class-methods-use-this
  fetchTrackingEvents(xmlDoc) {
    return xmlDoc
      .find('.//Tracking');
  }

  // eslint-disable-next-line class-methods-use-this
  fetchVideoClicks(xmlDoc) {
    const videoClicks = xmlDoc
      .get('.//VideoClicks');

    return videoClicks && videoClicks
      .childNodes()
      .filter(node => node.type() === 'element');
  }

  // eslint-disable-next-line class-methods-use-this
  injectImpressionElements(currentDocXml, impressions) {
    const creativesElement = currentDocXml.get('.//Creatives');
    if (!creativesElement) {
      throw new Error('Can`t inject Impression element into VAST document');
    }

    impressions
      .forEach(impression => creativesElement.addPrevSibling(impression));

    return currentDocXml;
  }

  injectTrackingEventElements(currentDocXml, trackingEvents) {
    let container = currentDocXml.get('.//TrackingEvents');
    if (!container) {
      container = createVastElement(this.documentContext, 'TrackingEvents');
      const injectionAnchor = currentDocXml.get('.//MediaFiles');
      if (!injectionAnchor) {
        throw new Error('Can`t inject TrackingEvents element into VAST document');
      }
      injectionAnchor.addNextSibling(container);
    }

    trackingEvents.forEach(child => container.addChild(child));

    return currentDocXml;
  }

  injectVideoClickElements(currentDocXml, videoClicks) {
    let container = currentDocXml.get('.//VideoClicks');
    if (!container) {
      container = createVastElement(this.documentContext, 'VideoClicks');
      const injectionAnchor = currentDocXml.get('.//TrackingEvents') || currentDocXml.get('.//MediaFiles');
      if (!injectionAnchor) {
        throw new Error('Can`t inject VideoClicks element into VAST document');
      }
      injectionAnchor.addNextSibling(container);
    }

    videoClicks.forEach(child => container.addChild(child));

    return currentDocXml;
  }
}

module.exports = DoubleClickVastHandler;
