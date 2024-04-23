'use strict';

const VASTProcessor = require('./VASTProcessor');

class TestVASTProcessor extends VASTProcessor {

  constructor(request, response) {
    super(request, response);
    this.tracking = true;
  }

  finishWithError(status, message) {
    this._sendResult(
      status || 500,
      message || 'Something went wrong',
      this._initialMediaFile,
      this._getCurrentMediaFile()
    );
  }

  successfulFinish(message) {
    /* eslint-disable no-param-reassign */

    const mediaFileAttributes = this._getCurrentMediaFileAttributes();

    if (message === undefined) {
      message = 'VAST with a ';

      switch (mediaFileAttributes.type) {
        case 'application/x-shockwave-flash':
          message = message.concat('Flash VPAID unit.');
          break;
        case 'application/javascript':
          message = message.concat('JS VPAID unit.');
          break;
        case 'video/mp4':
          message = message.concat('MP4 media file.');
          break;
        case 'video/x-flv':
          message = message.concat('FLV media file.');
          break;
        default:
          message = message.concat(mediaFileAttributes.type);
          message = message.concat(`. @TODO handle 'Content-Type': ${mediaFileAttributes.type}`);
      }
    }
    /* eslint-enable no-param-reassign */

    this._sendResult(200, message, this._initialMediaFile, this._getCurrentMediaFile(), this.trackingRequests);
  }

  _getCurrentMediaFile() {
    if (this.xmlDoc) {
      return this.xmlDoc.get('.//MediaFile');
    }

    return null;
  }

  _getCurrentMediaFileAttributes() {
    const attrs = {};

    const mediaFile = this._getCurrentMediaFile();

    if (mediaFile) {
      mediaFile.attrs().forEach((attr) => {
        attrs[attr.name()] = attr.value();
      });
    }

    return attrs;
  }

  _sendResult(httpStatus, message, inMediaFile, outMediaFile, trackingRequests) {
    let status = '';

    switch (httpStatus) {
      case 200:
        status = 'passed';
        break;
      default:
        status = 'failed';
    }

    const kid = this.kid;
    const mediaInfo = {};

    if (inMediaFile) {
      mediaInfo.in = inMediaFile.text();
    }

    if (outMediaFile) {
      mediaInfo.out = outMediaFile.text();
    }

    const result = {
      status,
      message,
      mediaInfo,
      kid,
      trackingRequests,
    };

    this.response.setHeader('Content-Type', 'application/json');

    this.response.send(JSON.stringify(result));

    this.destroy();
  }

  sendResponse() {// eslint-disable-line
    // nothing
  }

}

module.exports = TestVASTProcessor;
