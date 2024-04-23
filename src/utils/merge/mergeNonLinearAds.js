'use strict';

const XPATH_CREATIVE_NON_LINEAR_ADS = './/Creative/NonLinearAds';
const XPATH_NON_LINEAR = './/NonLinear';
const XPATH_NON_LINEAR_CLICK_TRACKING = './/NonLinearClickTracking';

const XPATH_CREATIVE_NON_LINEAR_ADS_TRACKING_EVENTS = './/Creative/NonLinearAds/TrackingEvents';
const XPATH_TRACKING_EVENTS = './/TrackingEvents';
const XPATH_TRACKING = './/Tracking';

function mergeTrackingEvents(inlineVast, wrapperVast) {
  const inlineNonLinearAdsList = inlineVast.find(XPATH_CREATIVE_NON_LINEAR_ADS);

  wrapperVast.find(XPATH_CREATIVE_NON_LINEAR_ADS_TRACKING_EVENTS).forEach((wrapperTrackingEvents) => {
    inlineNonLinearAdsList.forEach((inlineNonLinearAds) => {
      const inlineTrackingEvents = inlineNonLinearAds.get(XPATH_TRACKING_EVENTS);

      if (!inlineTrackingEvents) {
        inlineNonLinearAds.addChild(wrapperTrackingEvents.clone());

        return;
      }

      wrapperTrackingEvents.find(XPATH_TRACKING).forEach((wrapperTracking) => {
        inlineTrackingEvents.addChild(wrapperTracking.clone());
      });
    });
  });
}

function mergeNonLinearClickTracking(inlineVast, wrapperVast) {
  const inlineNonLinearList = inlineVast.find(XPATH_NON_LINEAR);

  wrapperVast.find(XPATH_NON_LINEAR_CLICK_TRACKING)
    .forEach((wrapperNonLinearClickTracking) => {
      inlineNonLinearList.forEach((inlineNonLinear) => {
        inlineNonLinear.addChild(wrapperNonLinearClickTracking.clone());
      });
    });
}

function mergeNonLinearAds(inlineVast, wrapperVast) {
  const inlineNonLinearAds = inlineVast.get(XPATH_CREATIVE_NON_LINEAR_ADS);
  const wrapperNonLinearAds = wrapperVast.get(XPATH_CREATIVE_NON_LINEAR_ADS);

  if (!inlineNonLinearAds || !wrapperNonLinearAds) {
    return inlineVast;
  }

  mergeTrackingEvents(inlineVast, wrapperVast);

  mergeNonLinearClickTracking(inlineVast, wrapperVast);

  return inlineVast;
}

module.exports = {
  mergeNonLinearAds,
};
