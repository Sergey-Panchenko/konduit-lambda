'use strict';

const libxml = require('libxmljs');

const createVastElement = (doc, name, content = '', attributes = {}) => {
  if (!doc || !name) {
    throw new Error('Invalid argument error');
  }
  const element = new libxml.Element(doc, name);
  if (content.trim().length > 0) element.cdata(content);
  element.attr(attributes);

  return element;
};

module.exports = createVastElement;
