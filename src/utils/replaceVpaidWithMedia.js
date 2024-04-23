'use strict';

// @TODO: default `contentType` is a temporary solution
//        `contentType` should be a mandatory parameter
//        revisit Electron-related usage of this method

// FIXME Remove it Deep Proxy
/**
 * Replace xmlDoc's VPAID MediaFile with pure Video/Flv MediaFile
 * Rise context success flag
 *
 * @param  {VASTProcessor}    context     -- target processing context
 * @param  {libxml.Document}  xmlDoc      -- xml document to update
 * @param  {String}           mediaUrl    -- url to media content
 * @param  {String}           contentType -- content type of media (default is 'video/mp4')
 * @return {libxml.Document}              -- updated xml doc
 */
const replaceVpaidWithMedia = (context, xmlDoc, mediaUrl, contentType = 'video/mp4') => {
  const mediaFile = xmlDoc.get('.//MediaFile');
  if (!mediaFile) return xmlDoc;

  mediaFile.getAttribute('apiFramework').remove();
  mediaFile.attr({ type: contentType });
  mediaFile.text(mediaUrl);

  if (context.tracking) {
    context.mediaFilesStack.push(mediaFile.clone());
  }

  context.mediaUrl = mediaUrl;
  context.isVpaidOptimized = true;
  context.successfulProcess = true;
  return xmlDoc;
};

module.exports = replaceVpaidWithMedia;
