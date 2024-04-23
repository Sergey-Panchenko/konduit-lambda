'use strict';

/**
 * Inject Error element into specified vastTag's Linear
 * Injects right before Impression/Creative elements
 *
 * @param  {libxml.Element}  vastTag       -- VAST to inject Error element
 * @param  {libxml.Element}  errorElement  -- Error element to inject
 *
 * @return {libxml.Element}                -- parent xml element
 */
const vastInjectError = (vastTag, errorElement) => {
  // @TODO detect more siblings for Error tag
  const siblingNode = vastTag.get('.//Impression|.//Creatives');

  if (siblingNode) {
    siblingNode.addPrevSibling(errorElement);
  } else {
    vastTag.addChild(errorElement);
  }

  return vastTag;
};

module.exports = vastInjectError;
