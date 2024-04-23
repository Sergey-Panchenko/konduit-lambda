'use strict';

/**
 * Checks if passed xml contains passed media types
 * @param  {libxml.Element} options.mediaFiles -- xml document which should be checked
 * @param  {Array<String>} options.mediaTypes -- array of media types to check (full or part of string)
 * @return {Boolean}
 */
const containsMediaTypes = (options) => {
  const { mediaFiles, mediaTypes } = options;

  if (!mediaFiles || !mediaFiles.length) return false;

  const mediaFilesTypes = mediaFiles.map((mf) => {
    const type = mf.getAttribute('type');
    return type && type.value();
  });

  for (let i = 0; i < mediaTypes.length; i += 1) {
    const isTypeInMediaFiles = mediaFilesTypes
      .some(mft => (new RegExp(mediaTypes[i])).test(mft));
    if (!isTypeInMediaFiles) return false;
  }
  return true;
};

module.exports = containsMediaTypes;
