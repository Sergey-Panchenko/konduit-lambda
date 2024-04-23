'use strict';

const libxml = require('libxmljs');

const xmlAddFirstChild = require('./xmlAddFirstChild');

/**
 * Inject video click tracking pixel (one of ClickTracking, ClickThrough, CustomClick)
 * into specified vastTag's Linear
 * Use existing VideoClicks element or create a new one
 *  - for InLine  -- next after MediaFiles
 *  - for Wrapper -- directly first child of Linear
 *
 * @param  {libxml.Element}  vastTag            -- VAST to inject collection
 * @param  {libxml.Element}  videoClickElement  -- video click element to be injected
 *
 * @return {libxml.Element}                     -- VideoClicks tag that contains passed list
 */
const vastInjectVideoClick = (vastTag, videoClickElement) => {
  const documentContext = (vastTag instanceof libxml.Element) ? vastTag.doc() : vastTag;

  let videoClicksElement = vastTag.get('.//VideoClicks');
  if (!videoClicksElement) {
    videoClicksElement = new libxml.Element(documentContext, 'VideoClicks');

    const videoClicksPreviousElement = vastTag.get('.//Linear/TrackingEvents|.//Linear/MediaFiles');
    if (videoClicksPreviousElement) {
      videoClicksPreviousElement.addNextSibling(videoClicksElement);
    } else {
      const linearElement = vastTag.get('.//Linear');
      xmlAddFirstChild(linearElement, videoClicksElement);
    }
  }

  videoClicksElement.addChild(videoClickElement);
  return videoClicksElement;
};

module.exports = vastInjectVideoClick;
