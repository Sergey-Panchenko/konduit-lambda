'use strict';

const libxml = require('libxmljs');

const PixelUrl = require('./PixelUrl');

const PIXEL_TYPES = {
  IMPRESSION: 'Impression',
  CLICK_THROUGH: 'ClickThrough',
  CLICK_TRACKING: 'ClickTracking',
  TRACKING_EVENT: 'Tracking',
  ERROR: 'Error',
};

const allowedPixelTypes = new Set(Object.keys(PIXEL_TYPES).map(k => PIXEL_TYPES[k]));

class PixelTag {

  static createTrackingEvent(props = {}) {
    return new this(Object.assign({}, props, {
      type: PIXEL_TYPES.TRACKING_EVENT,
      attributes: Object.assign({ event: props.eventType }, props.attributes || {}),
    }));
  }

  static createImpression(props = {}) {
    return new this(Object.assign({}, props, { type: PIXEL_TYPES.IMPRESSION }));
  }

  static createClickThrough(props = {}) {
    return new this(Object.assign({}, props, { type: PIXEL_TYPES.CLICK_THROUGH }));
  }

  static createClickTracking(props = {}) {
    return new this(Object.assign({}, props, { type: PIXEL_TYPES.CLICK_TRACKING }));
  }

  static createError(props = {}) {
    return new this(Object.assign({}, props, { type: PIXEL_TYPES.ERROR }));
  }

  constructor({
    type,
    documentContext,
    host = '/',
    path = '',
    parameters = {},
    // @TODO: quick solution
    //        ensure some parameters would be added to the end of url
    optionalParametersStr = '',
    attributes = {},
  }) {
    if (!(documentContext instanceof libxml.XMLDocument)) {
      throw new TypeError('DocumentContext is required to construct PixelTag');
    }

    if (!allowedPixelTypes.has(type)) {
      throw new TypeError(`Unknown pixel type: '${type}'`);
    }
    const element = new libxml.Element(documentContext, type);

    const pixelUrl = new PixelUrl({ host, path, parameters, optionalParametersStr });
    element.cdata(pixelUrl.toString());

    Object.keys(attributes)
      .forEach((attributeName) => {
        const attributeValue = attributes[attributeName];
        if (attributeValue !== undefined) {
          element.setAttribute(attributeName, attributeValue);
        }
      });

    // return element;
  }

}

PixelTag.TYPES = PIXEL_TYPES;

module.exports = PixelTag;
