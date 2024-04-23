'use strict';

const libxml = require('libxmljs');
const xmlAddFirstChild = require('./xmlAddFirstChild');

/**
 * Update existing AdParameters in vast tag if this element exist,
 * inject it to correct place if needed
 *
 * @param  {libxml.Element} vastTag             -- target vastTag that contains ad parameters element
 * @param  {string}         adParametersContent -- desired content of ad parameters element
 * @return {libxml.Element}                     -- vast tag itself
 */
const vastUpdateAdParameters = (vastTag, adParametersContent) => {
  const existingAdParameters = vastTag.get('.//AdParameters');
  const documentContext = vastTag instanceof libxml.Element ?
    vastTag.doc() : vastTag;

  if (existingAdParameters) {
    existingAdParameters.remove();
  }

  const adParametersElement = new libxml.Element(documentContext, 'AdParameters');
  adParametersElement.cdata(adParametersContent);

  const trackingEventsElement = vastTag.get('.//Linear/TrackingEvents');
  const durationElement = vastTag.get('.//Linear/Duration');

  if (trackingEventsElement) {
    trackingEventsElement.addNextSibling(adParametersElement);
  } else if (durationElement) {
    durationElement.addNextSibling(adParametersElement);
  } else {
    const linearElement = vastTag.get('.//Linear');

    if (linearElement) {
      xmlAddFirstChild(linearElement, adParametersElement);
    }
  }
};

module.exports = vastUpdateAdParameters;
