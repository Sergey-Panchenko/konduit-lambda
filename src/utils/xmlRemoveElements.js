'use strict';

const xmlRemoveElements = (parent, xpathQuery) =>
  parent.find(xpathQuery).forEach(element => element.remove());

module.exports = xmlRemoveElements;
