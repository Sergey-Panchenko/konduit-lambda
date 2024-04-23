'use strict';

const CLICK_THROUGTH_XPATH = '//Linear/VideoClicks/ClickThrough';

/**
 * Attempt to find ClickThrough URI in specified VAST document

 * @param  {libxml.Document} xmlDoc   -- XML document to lookup
 *
 * @return {String}                   -- content of ClickThrough tag or null, in case there is no tag present
 */
const detectClickThroughURI = (xmlDoc) => {
  let resultingURI = null;
  const clickThroughElement = xmlDoc.get(CLICK_THROUGTH_XPATH);

  if (clickThroughElement) {
    resultingURI = clickThroughElement.text() || null;
  }

  return resultingURI;
};

module.exports = detectClickThroughURI;
