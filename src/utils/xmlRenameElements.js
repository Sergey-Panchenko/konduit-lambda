'use strict';

const xmlRenameElements = (root, elementPath, newName) => {
  const elementsToRename = root.find(elementPath);
  elementsToRename.forEach(element => element.name(newName));

  return root;
};

module.exports = xmlRenameElements;
