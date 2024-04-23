'use strict';

// @NOTE: special checker for mobile app ad (ios - webkit, android - chrome webview)
const isMobilePlatformRequest = ({ osName, browserName, headers }) => {
  const isMobileOs = (osName.toLowerCase() === 'android') ||
    (osName.toLowerCase() === 'ios');
  const isMobileBrowser = (browserName.toLowerCase() === 'chrome webview') ||
    (browserName.toLowerCase() === 'webkit');
  const isOriginHeaderExist = !!headers.origin;

  return isMobileOs && isMobileBrowser && !isOriginHeaderExist;
};

module.exports = isMobilePlatformRequest;
