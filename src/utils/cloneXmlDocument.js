'use strict';

const libxml = require('libxmljs');

const cloneXmlDocument = (xmlDocument) => {
  const newXmlDocument = new libxml.Document();
  newXmlDocument.root(xmlDocument.root().clone());

  return newXmlDocument;
};

module.exports = cloneXmlDocument;
