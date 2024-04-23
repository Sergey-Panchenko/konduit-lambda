/* eslint-disable class-methods-use-this,no-unused-vars */

'use strict';

const _ = require('lodash');
const libxml = require('libxmljs');
const url = require('url');

const createVastElement = require('../utils/createVastElement');

const TRACKING_EVENT_TYPES_SET = new Set([
  'start',
  'firstQuartile',
  'midpoint',
  'thirdQuartile',
  'complete',
  'mute',
  'unmute',
  'pause',
  'resume',
  'rewind',
  'fullscreen',
]);

const knownSpotXMediaFileUrls = new Set([
  'http://aka.spotxcdn.com/integration/instreamadbroker/v1/instreamadbroker/beta.js', // Pluto
  'https://cdn.spotxcdn.com/integration/instreamadbroker/v1/instreamadbroker.js', // Daily Mail
]);

const REGEXP_MIME_TYPE_VIDEO = new RegExp(/video/i);

// TODO: The handler has a simple interface that can be covered with unit tests
class SpotXVastHandler {

  constructor(context) {
    this.context = context;
    this.adParameters = {};
    const currentDocXml = this.context.xmlDoc;
    this.documentContext = (currentDocXml instanceof libxml.Element) ? currentDocXml.doc() : currentDocXml;
    this.initialized = false;
  }

  /**
   * Check if the current tag contains real video in the media files section
   *
   * @returns {boolean} true if video available (with mime type "video/...")
   */
  hasVideoInMediaFiles(mediaFiles) {
    return _.some(mediaFiles, (mediaFile) => {
      if (mediaFile && _.has(mediaFile, 'mime_type')) {
        return REGEXP_MIME_TYPE_VIDEO.test(mediaFile.mime_type);
      }
      return false;
    });
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

    const adSystem = this.determineAdSystemForTag(this.context.xmlDoc);
    if (adSystem !== 'SpotXchange') {
      return false;
    }

    const mediaFileUrl = this.determineMediaFileUrl(this.context.xmlDoc);
    if (!knownSpotXMediaFileUrls.has(mediaFileUrl)) {
      return false;
    }

    const adParameters = this.fetchAdParameters(this.context.xmlDoc);
    const mediaFiles = this.fetchMediaFiles(adParameters);
    if (!this.hasVideoInMediaFiles(mediaFiles)) {
      return false;
    }
    this.adParameters = adParameters;

    // TODO: The check could be more strict after testing
    // NOTE: Support tags from http://search.spotxchange.com/vast/2.0/ only
    // const vastUrlHost = this.determineHostForUrl(this.context.currentVastUrl || this.context.vastUrl);
    // if (vastUrlHost !== 'search.spotxchange.com') {
    //   return false;
    // }

    this.initialized = true;

    return true;
  }

  /**
   * Generate a current tag using current execution context.
   *
   * @returns libxml document that can be assigned back to context.xmlDoc
   */
  generateVastDocument() {
    let currentDocXml = this.context.xmlDoc;

    if (!this.initialized) {
      // TODO: Makes sense to throw an Error here
      return currentDocXml;
    }

    const impressions = this.fetchImpressions(this.adParameters)
      .map(definition => this.createImpression(definition));

    const trackingEvents = this.fetchTrackingEvents(this.adParameters)
      .map(definition => this.createTrackingEvent(definition));

    const videoClickTrackings = this.fetchVideoClicks(this.adParameters)
      .map(definition => this.createClickTracking(definition));
    const videoClickThrough = this.createClickThrough(this.fetchVideoClickUrl(this.adParameters));
    const videoClicks = [videoClickThrough].concat(videoClickTrackings);

    const mediaFiles = this.fetchMediaFiles(this.adParameters)
      .map(definition => this.createMediaFileElement(definition));

    currentDocXml = this.injectImpressionElements(this.documentContext, currentDocXml, impressions);
    currentDocXml = this.injectTrackingEventElements(this.documentContext, currentDocXml, trackingEvents);
    currentDocXml = this.injectVideoClickElements(this.documentContext, currentDocXml, videoClicks);
    currentDocXml = this.injectMediaFileElements(this.documentContext, currentDocXml, mediaFiles);
    currentDocXml = this.removeAdParametersElement(currentDocXml);

    return currentDocXml;
  }

  fetchAdParameters(currentDocXml) {
    const adParametersElement = currentDocXml.get('.//InLine//Creatives//Creative//Linear//AdParameters');

    let result = {};
    if (adParametersElement && adParametersElement.text()) {
      const adParametersJsonString = adParametersElement.text();

      try {
        result = JSON.parse(adParametersJsonString);
      } catch (e) {
        // TODO: Log the error and stop processing
        result = {};
      }
    }

    return result;
  }

  fetchImpressions(adParameters) {
    return _.get(adParameters, ['media', 'tracking', 'beacon'], [])
      .filter(definition => definition.type === 'impression' || definition.type === 'initialization');
  }

  fetchTrackingEvents(adParameters) {
    return _.get(adParameters, ['media', 'tracking', 'beacon'], [])
      .filter(definition => TRACKING_EVENT_TYPES_SET.has(definition.type));
  }

  fetchVideoClickUrl(adParameters) {
    return _.get(adParameters, 'page_url', '');
  }

  fetchVideoClicks(adParameters) {
    return _.get(adParameters, ['media', 'tracking', 'beacon'], [])
      .filter(definition => definition.type === 'click');
  }

  fetchMediaFiles(adParameters) {
    const videoDefinitions = _.get(adParameters, ['media', 'video'], {});

    return _.values(videoDefinitions);
  }

  createClickTracking(videoClickDefinition) {
    return createVastElement(
      this.documentContext,
      'ClickTracking',
      videoClickDefinition.beacon_url
    );
  }

  createClickThrough(pageUri) {
    return createVastElement(
      this.documentContext,
      'ClickThrough',
      pageUri
    );
  }

  createTrackingEvent(trackingEventDefinition) {
    return createVastElement(
      this.documentContext,
      'Tracking',
      trackingEventDefinition.beacon_url,
      { event: trackingEventDefinition.type }
    );
  }

  createImpression(impressionDefinition) {
    return createVastElement(
      this.documentContext,
      'Impression',
      impressionDefinition.beacon_url
    );
  }

  createMediaFileElement(mediaDefinition) {
    return createVastElement(
      this.documentContext,
      'MediaFile',
      mediaDefinition.source_uri,
      {
        delivery: 'progressive',
        maintainAspectRatio: mediaDefinition.maintain_aspect_ratio,
        bitrate: mediaDefinition.bitrate,
        heigth: mediaDefinition.height,
        width: mediaDefinition.width,
        type: mediaDefinition.mime_type,
      }
    );
  }

  injectImpressionElements(documentContext, currentDocXml, impressions) {
    const creativesElement = currentDocXml.get('.//Creatives');
    if (!creativesElement) {
      throw new Error('Can`t inject Impression element into VAST document');
    }

    impressions
      .forEach(impression => creativesElement.addPrevSibling(impression));

    return currentDocXml;
  }

  injectTrackingEventElements(documentContext, currentDocXml, trackingEvents) {
    let container = currentDocXml.get('.//TrackingEvents');
    if (!container) {
      container = createVastElement(documentContext, 'TrackingEvents');
      const injectionAnchor = currentDocXml.get('.//MediaFiles');
      if (!injectionAnchor) {
        throw new Error('Can`t inject TrackingEvents element into VAST document');
      }
      injectionAnchor.addNextSibling(container);
    }

    trackingEvents.forEach(child => container.addChild(child));

    return currentDocXml;
  }

  injectVideoClickElements(documentContext, currentDocXml, videoClicks) {
    let container = currentDocXml.get('.//VideoClicks');
    if (!container) {
      container = createVastElement(documentContext, 'VideoClicks');
      const injectionAnchor = currentDocXml.get('.//TrackingEvents') || currentDocXml.get('.//MediaFiles');
      if (!injectionAnchor) {
        throw new Error('Can`t inject VideoClicks element into VAST document');
      }
      injectionAnchor.addNextSibling(container);
    }

    videoClicks.forEach(child => container.addChild(child));

    return currentDocXml;
  }

  injectMediaFileElements(documentContext, currentDocXml, newMediaFileElements) {
    const container = currentDocXml.get('.//Creative//Linear//MediaFiles');

    if (container && newMediaFileElements && newMediaFileElements.length) {
      container.childNodes().forEach(element => element.remove());

      newMediaFileElements.forEach(element => container.addChild(element));
    }

    return currentDocXml;
  }

  removeAdParametersElement(currentDocXml) {
    const container = currentDocXml.get('.//Creative//Linear//AdParameters');
    if (container) {
      container.remove();
    }

    return currentDocXml;
  }

  // NOTE: This could be a helper function
  determineHostForUrl(resourceUrl) {
    const parsedUrl = url.parse(resourceUrl);
    if (parsedUrl && parsedUrl.hostname) {
      return parsedUrl.hostname;
    }
    return '';
  }

  // NOTE: This could be a helper function
  determineAdSystemForTag(xmlDoc) {
    const adSystemElement = xmlDoc.get('.//Ad//InLine//AdSystem');
    if (adSystemElement && adSystemElement.text()) {
      return adSystemElement.text().trim();
    }
    return '';
  }

  // NOTE: This could be a helper function
  determineMediaFileUrl(xmlDoc) {
    const mediaFileElement = xmlDoc.get('.//MediaFile');
    if (mediaFileElement && mediaFileElement.text()) {
      return mediaFileElement.text().trim();
    }
    return '';
  }
}

module.exports = SpotXVastHandler;
