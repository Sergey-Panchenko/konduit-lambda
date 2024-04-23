'use strict';

const uaParser = require('ua-parser-js');

class UserAgentParser {
  constructor(userAgentString = '', xDeviceUserAgentString = '') {
    this.userAgentData = uaParser(userAgentString);
    if (xDeviceUserAgentString && !this.userAgentData.browser.name) {
      this.userAgentData = uaParser(xDeviceUserAgentString);
    }
  }

  get browserName() {
    return this.userAgentData.browser.name || null;
  }

  get osName() {
    return this.userAgentData.os.name || null;
  }

  get browserMajorVersion() {
    return this.userAgentData.browser.version ? this.userAgentData.browser.version.split('.')[0] : null;
  }

  get deviceType() {
    return this.userAgentData.device.type || null;
  }
}

module.exports = UserAgentParser;
