'use strict';

/**
 * Inject childElement as directly first child of xmlElement
 *
 * @param  {libxml.Element} parentElement   -- parent element
 * @param  {libxml.Element} childElement -- child to inject
 *
 * @return {libxml.Element}              -- parentElement from properties
 */
const xmlAddFirstChild = (parentElement, childElement) => {
  if (parentElement) {
    const currentlyFirstChild = parentElement.child(0);
    if (currentlyFirstChild) {
      currentlyFirstChild.addPrevSibling(childElement);
    } else {
      parentElement.addChild(childElement);
    }
  }

  return parentElement;
};

module.exports = xmlAddFirstChild;
