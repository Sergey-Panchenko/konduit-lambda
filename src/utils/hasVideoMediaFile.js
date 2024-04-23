'use strict';

/**
 * Checks if passed Ad contains Video unit
 * @param  {libxml.Element} xmlDoc -- Ad unit to check
 * @return {Boolean}
 */
const hasVideoMediaFile = (xmlDoc) => {
  const mediaFilesElement = xmlDoc.get('.//MediaFiles');
  if (!mediaFilesElement) return false;

  const mediaFilesArray = mediaFilesElement.childNodes();

  for (let i = 0, len = mediaFilesArray.length; i < len; i += 1) {
    const type = mediaFilesArray[i].getAttribute('type');
    const mediaUrl = type && type.value();

    if (mediaUrl && mediaUrl.toLowerCase().trim().startsWith('video')) {
      return true;
    }
  }

  return false;
};

module.exports = hasVideoMediaFile;
