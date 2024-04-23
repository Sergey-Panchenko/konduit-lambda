'use strict';

const mergeVideoClicksTo = (inlineVast, wrapperVast) => {
  const inlineCreativesList = inlineVast.find('.//Creative//Linear');
  const wrapperCreativesList = wrapperVast.find('.//Creative//Linear');

  if (!wrapperCreativesList.length) {
    return inlineVast;
  }

  wrapperCreativesList.forEach((wrapperCreative, index) => {
    const inlineCreative = inlineCreativesList[index];

    if (inlineCreative) {
      const inlineVideoClicks = inlineCreative.get('.//VideoClicks');
      const wrapperVideoClicks = wrapperCreative.get('.//VideoClicks');

      if (!wrapperVideoClicks) {
        return;
      }

      if (!inlineVideoClicks) {
        inlineCreative.addChild(wrapperVideoClicks.clone());
        return;
      }

      // wrapperVideoClicks && inlineVideoClicks
      // @NOTE: `ClickThrough` - should not be able in the Wrapper node
      const wrapperClickTrackingList = wrapperVideoClicks.find('.//ClickTracking');
      wrapperClickTrackingList.forEach(ClickTracking => inlineVideoClicks.addChild(ClickTracking.clone()));

      const wrapperCustomClickList = wrapperVideoClicks.find('.//CustomClick');
      wrapperCustomClickList.forEach(customClick => inlineVideoClicks.addChild(customClick.clone()));
    }
  });

  return inlineVast;
};

module.exports = {
  mergeVideoClicksTo,
};
