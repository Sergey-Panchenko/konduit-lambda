'use strict';

const createVastElement = require('./createVastElement');

const getOrCreateElement = (parentElement, xpath, name, content = '', attrs = {}) => {
  if (!parentElement || !xpath || !name) {
    throw new Error('Invalid argument error');
  }
  let element = parentElement.get(xpath);

  if (!element) {
    element = createVastElement(parentElement.doc(), name, content, attrs);
    parentElement.addChild(element);
  }

  return element;
};

module.exports = getOrCreateElement;
