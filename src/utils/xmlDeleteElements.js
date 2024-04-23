'use strict';

const xmlDeleteElements = (root, path) => {
  const elementsToDelete = root.find(path);
  elementsToDelete.forEach(element => element.remove());

  return root;
};

module.exports = xmlDeleteElements;
