'use strict';

const detectControlGroup = require('./detectControlGroup');
const collectFluentVastType = require('./collectFluentVastType');
const readableAB = require('./readableAB');

function pullOptimizations(vastReport = {}, adReport = {}) {
  const vastOptimizations = vastReport.optimizationChain || [];
  const adOptimizations = adReport.optimizationChain || [];

  return [].concat(vastOptimizations, adOptimizations);
}

function pullVendors(vastReport = {}, adReport = {}) {
  const vastVendors = vastReport.vastVendorsChain || [];
  const adVendors = adReport.vastVendorsChain || [];

  return [].concat(vastVendors, adVendors);
}

function pullVastUrls(vastReport = {}, adReport = {}) {
  const vastUrls = vastReport.vastUrlChain || [];
  const adUrls = adReport.vastUrlChain || [];

  return [].concat(vastUrls, adUrls);
}

function adaptElkArray(acc, value, index) {
  acc[`${index + 1}`] = value;
  return acc;
}

function formatOptimizationChain(vastReport = {}, adReport = {}) {
  const optimizationChain = pullOptimizations(vastReport, adReport);
  const vendorsChain = pullVendors(vastReport, adReport);
  const vastUrlChain = pullVastUrls(vastReport, adReport);

  const adContent = adReport.content || collectFluentVastType(adReport).inlineContent;
  const finalVastVendor = vendorsChain.length ? vendorsChain[vendorsChain.length - 1] : 'none';

  return {
    ab: readableAB(adReport.konduitAbType),
    adId: adReport.adId || vastReport.adId || 'none',
    creativeAdId: adReport.creativeAdId || vastReport.creativeAdId || 'none',
    creativeIds: adReport.creativeIds || vastReport.creativeIds || ['none'],
    optimizations: optimizationChain.join('_') || 'none',
    vastVendors: vendorsChain.join('_') || 'none',
    vpaidVendor: adReport.vpaidVendor || 'none',
    vpaidUrl: adReport.vpaidUrl || 'none',
    mediaUrl: adReport.mediaUrl || 'none',
    content: adContent,
    clickThrough: adReport.clickThroughUri || 'none',
    vastType: detectControlGroup(adReport),
    vastUrlChain: vastUrlChain && vastUrlChain.length ?
      JSON.stringify(vastUrlChain, null, ' ') : 'none',
    finalVastVendor,
  };
}

function formatOptimizationReport(context) {
  const adpodReports = context.adpodReports || [];

  if (!adpodReports.length) {
    return [formatOptimizationChain([], context)]
      .reduce(adaptElkArray, {});
  }

  return adpodReports
    .map(adReport => formatOptimizationChain(context, adReport))
    .reduce(adaptElkArray, {});
}

module.exports = formatOptimizationReport;
