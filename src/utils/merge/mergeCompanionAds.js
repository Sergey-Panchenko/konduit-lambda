'use strict';

const mergeCompanionAds = (inlineVast, wrapperVast) => {
  const wrapperCompanionAdsList = wrapperVast.find('.//Creative/CompanionAds');
  const inlineCreatives = inlineVast.get('.//Creatives');

  if (!wrapperCompanionAdsList.length || !inlineCreatives) {
    return inlineVast;
  }

  // Merge NonLinearAds>TrackingEvents
  wrapperCompanionAdsList.forEach((wrapperCompanionAds) => {
    inlineCreatives.addChild(wrapperCompanionAds.parent().clone());
  });

  return inlineVast;
};

module.exports = {
  mergeCompanionAds,
};
