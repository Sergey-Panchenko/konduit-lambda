'use strict';

const libxml = require('libxmljs');

/**
 * Applies filtering over Vast Tag's Ad units
 * Returns new vast doc that contains Ad units that fits to filterFunction
 *
 * @param  {libxml.Document}   xmlDoc         -- vast document to iterate
 * @param  {Function}          filterFunction -- filtering function
 *                                               accepts libxml.Element instances
 * @return {libxml.Document}                  -- resulting vast document
 */
const filterAdUnits = (xmlDoc, filterFunction) => {
  const rootClone = xmlDoc.root().clone();
  rootClone.find('.//Ad')
    .forEach(adUnit => adUnit.remove());

  const selectedAdUnits = xmlDoc
    .find('.//Ad')
    .filter(filterFunction);

  selectedAdUnits
    .reverse()
    .forEach((adUnit) => {
      const firstChild = rootClone.child(1);
      if (firstChild) {
        firstChild.addPrevSibling(adUnit);
      } else {
        rootClone.addChild(adUnit);
      }
    });

  const result = new libxml.Document('1.0', 'utf8');

  result.node('VAST');

  const resultRoot = result.root();
  const targetVersion = rootClone.getAttribute('version');
  if (targetVersion) {
    resultRoot.attr({ version: targetVersion.value() });
  }

  // Add rest of content only for non-empty VAST
  if (selectedAdUnits.length) {
    rootClone.childNodes().forEach(node => resultRoot.addChild(node));
  }

  return result;
};

module.exports = filterAdUnits;
