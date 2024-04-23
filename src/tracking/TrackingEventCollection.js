'use strict';

const _ = require('lodash');
const TrackingEvent = require('./TrackingEvent');

const BASIC_EVENT_PROPERTIES = ['ci', 'dt', 'ev', 'ac', 'si', 'pc', 'pi', 'cr',
  'dm', 'ai', 'ui', 'vs', 'pp', 'vver', 'vsch', '_cb'];


class TrackingEventCollection {

  /**
   * @param pixelServerUrl
   * @param data
   */
  constructor(pixelServerUrl, data) {
    this.pixelServerUrl = pixelServerUrl;
    this.sharedData = data;
    const basicEventProperties = _.pick(data, BASIC_EVENT_PROPERTIES);

    this._trackingEventList = [
      TrackingEvent.create(TrackingEvent.START, pixelServerUrl, basicEventProperties),
      TrackingEvent.create(TrackingEvent.FIRST_QUARTILE, pixelServerUrl, basicEventProperties),
      TrackingEvent.create(TrackingEvent.MID_POINT, pixelServerUrl, basicEventProperties),
      TrackingEvent.create(TrackingEvent.THIRD_QUARTILE, pixelServerUrl, basicEventProperties),
      TrackingEvent.create(TrackingEvent.COMPLETE, pixelServerUrl, basicEventProperties),
      TrackingEvent.create(TrackingEvent.PAUSE, pixelServerUrl, basicEventProperties),
      TrackingEvent.create(TrackingEvent.MUTE, pixelServerUrl, basicEventProperties),
      TrackingEvent.create(TrackingEvent.UNMUTE, pixelServerUrl, basicEventProperties),
      TrackingEvent.create(TrackingEvent.FULLSCREEN, pixelServerUrl, basicEventProperties),
      TrackingEvent.create(TrackingEvent.COLLAPSE, pixelServerUrl, basicEventProperties),
      TrackingEvent.create(TrackingEvent.CREATIVE_VIEW, pixelServerUrl, basicEventProperties),
      TrackingEvent.create(TrackingEvent.RESUME, pixelServerUrl, basicEventProperties),
      TrackingEvent.create(TrackingEvent.REWIND, pixelServerUrl, basicEventProperties),
      TrackingEvent.create(TrackingEvent.EXPAND, pixelServerUrl, basicEventProperties),
      TrackingEvent.create(TrackingEvent.ACCEPT_INVITATION, pixelServerUrl, basicEventProperties),
      TrackingEvent.create(TrackingEvent.CLOSE, pixelServerUrl, basicEventProperties),
      TrackingEvent.create(TrackingEvent.ERROR, pixelServerUrl, basicEventProperties),
    ];
  }

  /**
   * @param libxml.Document
   * @returns {Array}
   */
  toXmlElement(parentDoc) {
    return this._trackingEventList.map(event => event.toXmlElement(parentDoc));
  }
}

module.exports = TrackingEventCollection;
