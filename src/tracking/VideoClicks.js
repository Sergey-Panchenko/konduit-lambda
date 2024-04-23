'use strict';

// @deadcode
class VideoClicks {

  // @TODO: check if we still need this class
  static create(pixelServerUrl) {
    return new VideoClicks(pixelServerUrl);
  }

  constructor(pixelServerUrl) {
    this.pixelServerUrl = pixelServerUrl;
  }

  toSerializedObject() {
    return {
      ClickThrough: [
        { $: {}, _: this.pixelServerUrl },
      ],
      ClickTracking: [
        { $: {}, _: `${this.pixelServerUrl}?type=click` },
      ],
    };
  }

}

module.exports = VideoClicks;
