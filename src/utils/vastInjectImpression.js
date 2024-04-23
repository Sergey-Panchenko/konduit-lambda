'use strict';

/**
 * Inject Impression element into correct position of VAST tag
 *
 * @param  {libxml.Element}  vastTag            -- VAST to inject collection
 * @param  {libxml.Element}  impressionElement  -- Impression element to inject
 *
 * @return {libxml.Element}                     -- parent node where Impression is injected
 */
const vastInjectImpression = (vastTag, impressionElement) => {
  if (!vastTag || !impressionElement) return null;

  const parentNode = vastTag.get('.//InLine|.//Wrapper');
  if (parentNode) {
    const sublingNode = parentNode.get('.//Impression|.//Attempt|.//Creatives');

    if (sublingNode) {
      sublingNode.addPrevSibling(impressionElement);
    }
  }

  return parentNode;
};

module.exports = vastInjectImpression;
