'use strict';

const mergeTrackingEventsTo = (inlineVast, wrapperVast) => {
  const inlineCreativesList = inlineVast.find('.//Creative//Linear');
  const wrapperCreativesList = wrapperVast.find('.//Creative//Linear');

  if (!wrapperCreativesList.length) {
    return inlineVast;
  }

  wrapperCreativesList.forEach((wrapperCreative, index) => {
    const inlineCreative = inlineCreativesList[index];

    if (inlineCreative) {
      const inlineTrackingEvents = inlineCreative.get('.//TrackingEvents');
      const wrapperTrackingEvents = wrapperCreative.get('.//TrackingEvents');

      if (!wrapperTrackingEvents) {
        return;
      }

      if (!inlineTrackingEvents) {
        inlineCreative.addChild(wrapperTrackingEvents.clone());
        return;
      }

      // wrapperTrackingEvents && inlineTrackingEvents
      const wrapperTrackingEventsList = wrapperTrackingEvents.find('.//Tracking');
      wrapperTrackingEventsList.forEach(tracking => inlineTrackingEvents.addChild(tracking.clone()));
    }
  });

  return inlineVast;
};

module.exports = {
  mergeTrackingEventsTo,
};
