'use strict';

const libxml = require('libxmljs');

const xmlAddFirstChild = require('./xmlAddFirstChild');

/**
 * Inject tracking events list into specified vastTag's Linear
 * use existing TrackingEvents tag or create new one
 *  - for InLine  -- next after MediaFiles
 *  - for Wrapper -- directly first child of Linear
 *
 * @param  {libxml.Element}      vastTag         -- VAST to inject collection
 * @param  {[..libxml.Element]}  trackingEvents  -- tracking events list to be injected
 *
 * @return {libxml.Element}                      -- TrackingEvents tag that contains passed list
 */
const vastInjectTrackingEvents = (vastTag, trackingEvents) => {
  let trackingEventsElement = vastTag.get('.//TrackingEvents');
  const documentContext = (vastTag instanceof libxml.Element) ? vastTag.doc() : vastTag;

  if (!trackingEventsElement) {
    trackingEventsElement = new libxml.Element(documentContext, 'TrackingEvents');

    const linearElement = vastTag.get('.//Linear');
    const mediaFileElement = linearElement.get('./MediaFiles');
    if (mediaFileElement) {
      mediaFileElement.addNextSibling(trackingEventsElement);
    } else {
      xmlAddFirstChild(linearElement, trackingEventsElement);
    }
  }

  trackingEvents.forEach(trackingEvent => trackingEventsElement.addChild(trackingEvent));

  return trackingEventsElement;
};

module.exports = vastInjectTrackingEvents;
