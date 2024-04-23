'use strict';

const url = require('url');
const libxmljs = require('libxmljs');

const { wrapUrlAsPublic } = require('../utils/publicUrlCrypto');

class TrackingEvent {

  static create(type, pixelServerUrl, data) {
    return new TrackingEvent(type, pixelServerUrl, data);
  }

  constructor(type, pixelServerUrl, data) {
    this.type = type;
    this.pixelServerUrl = pixelServerUrl;
    this.data = TrackingEvent.normalizeData(data);
  }

  /**
   * Normalize data object.
   * Convert boolean values into string presentation.
   *
   * @param data object
   * @returns normalized data object
   */
  static normalizeData(data) {
    Object.keys(data).forEach((key) => {
      if (typeof (data[key]) === typeof (true)) {
        data[key] = data[key] ? '1' : '0'; // eslint-disable-line no-param-reassign
      }
    });
    return data;
  }

  static isEventValidForVastVersion(eventName, vastVersion) {
    if (!TrackingEvent.vastVersionValidEvents[eventName]) {
      return false;
    }

    return TrackingEvent.vastVersionValidEvents[eventName].has(vastVersion);
  }

  getUrl() {
    const urlObject = url.parse(this.pixelServerUrl, true);
    Object.assign(urlObject.query, this.data);
    urlObject.query.ev = this.type;

    const encodedUrl = url.format(wrapUrlAsPublic(urlObject));
    const eventUrl = encodedUrl.replaceAll('%5B', '[')
      .replaceAll('%5D', ']')
      .replaceAll('%25', '%');
    return eventUrl;
  }

  toXmlElement(parentDoc) {
    const element = new libxmljs.Element(parentDoc, 'Tracking');

    element.cdata(this.getUrl());
    element.attr({
      event: this.type,
    });

    return element;
  }

}

TrackingEvent.IMPRESSION = 'impression';
TrackingEvent.CLICK = 'click';
TrackingEvent.START = 'start';
TrackingEvent.FIRST_QUARTILE = 'firstQuartile';
TrackingEvent.MID_POINT = 'midpoint';
TrackingEvent.THIRD_QUARTILE = 'thirdQuartile';
TrackingEvent.COMPLETE = 'complete';
TrackingEvent.PAUSE = 'pause';
TrackingEvent.RESUME = 'resume';
TrackingEvent.LOADED = 'loaded';
TrackingEvent.MUTE = 'mute';
TrackingEvent.UNMUTE = 'unmute';
TrackingEvent.SKIP = 'skip';
TrackingEvent.CLOSE_LINEAR = 'closeLinear';
TrackingEvent.CLOSE = 'close';
TrackingEvent.REWIND = 'rewind';
TrackingEvent.PLAYER_EXPAND = 'playerExpand';
TrackingEvent.PLAYER_COLLAPSE = 'playerCollapse';
TrackingEvent.TIME_SPENT_VIEWING = 'timeSpentViewing';
TrackingEvent.OTHER_AD_INTERACTION = 'otherAdInteraction';
TrackingEvent.PROGRESS = 'progress';
TrackingEvent.CREATIVE_VIEW = 'creativeView';
TrackingEvent.ACCEPT_INVITATION_LINEAR = 'acceptInvitationLinear';
TrackingEvent.ACCEPT_INVITATION = 'acceptInvitation';
TrackingEvent.FULLSCREEN = 'fullscreen';
TrackingEvent.COLLAPSE = 'collapse';
TrackingEvent.EXPAND = 'expand';
TrackingEvent.ERROR = 'error';

TrackingEvent.vastVersionValidEvents = {
  [TrackingEvent.START]: new Set([2, 3, 4, 4.1]),
  [TrackingEvent.FIRST_QUARTILE]: new Set([2, 3, 4, 4.1]),
  [TrackingEvent.MID_POINT]: new Set([2, 3, 4, 4.1]),
  [TrackingEvent.THIRD_QUARTILE]: new Set([2, 3, 4, 4.1]),
  [TrackingEvent.COMPLETE]: new Set([2, 3, 4, 4.1]),
  [TrackingEvent.PAUSE]: new Set([2, 3, 4, 4.1]),
  [TrackingEvent.RESUME]: new Set([2, 3, 4, 4.1]),
  [TrackingEvent.LOADED]: new Set([4.1]),
  [TrackingEvent.MUTE]: new Set([2, 3, 4, 4.1]),
  [TrackingEvent.UNMUTE]: new Set([2, 3, 4, 4.1]),
  [TrackingEvent.SKIP]: new Set([3, 4, 4.1]),
  [TrackingEvent.CLOSE_LINEAR]: new Set([3, 4.1]),
  [TrackingEvent.REWIND]: new Set([2, 3, 4, 4.1]),
  [TrackingEvent.PLAYER_EXPAND]: new Set([4, 4.1]),
  [TrackingEvent.PLAYER_COLLAPSE]: new Set([4, 4.1]),
  [TrackingEvent.TIME_SPENT_VIEWING]: new Set([4]),
  [TrackingEvent.OTHER_AD_INTERACTION]: new Set([4, 4.1]),
  [TrackingEvent.PROGRESS]: new Set([3, 4, 4.1]),
  [TrackingEvent.CREATIVE_VIEW]: new Set([2, 3, 4, 4.1]),
  [TrackingEvent.ACCEPT_INVITATION_LINEAR]: new Set([3, 4]),
  [TrackingEvent.CLOSE]: new Set([2]),
};

module.exports = TrackingEvent;
