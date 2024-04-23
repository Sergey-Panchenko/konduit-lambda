'use strict';

/* eslint max-classes-per-file: ["error", 3] */

const StatsD = require('hot-shots');
const _ = require('lodash');

const getConfigParameter = require('./getConfigParameter');
const { mapUrlToVendorTagValue } = require('./mapUrlToVendorName');
const detectControlGroup = require('./detectControlGroup');
const detectVastTagType = require('./detectVastTagType');

const {
  whitelistBrowserDatadogTag,
  whitelistOsDatadogTag,
  whitelistVastVendorDatadogTag,
  whitelistVpaidVendorDatadogTag,
} = require('./whitelistDatadogTags');

const optimizationMap = {
  browser: whitelistBrowserDatadogTag,
  os: whitelistOsDatadogTag,
  vendor: whitelistVastVendorDatadogTag,
  'vpaid-vendor': whitelistVpaidVendorDatadogTag,
};

const loggerService = require('../services/logger');

const AD_TYPES = require('../constants/adTypes');

const whitelabel = getConfigParameter('KONDUIT_WHITELABEL');


const METRIC_VAST_REQUEST_NAME = 'kme.vast.request';
const METRIC_VAST_CREATIVE_NAME = 'kme.vast.creative';
const METRIC_VAST_CREATIVE_OTT_NAME = 'kme.vast.creative.ott';
const METRIC_VAST_BLOCKED_REQUEST_NAME = 'kme.vast.request.blocked';
const METRIC_VAST_UNIQUE_REQUEST_NAME = 'kme.vast.request.unique';
const METRIC_VAST_REDIRECT_REQUEST_NAME = 'kme.vast.request.redirect';
const METRIC_VAST_WO_REQUEST_NAME = 'kme.vast.request.wo';
const METRIC_VAST_AB_REQUEST_NAME = 'kme.vast.ab';
const METRIC_VAST_OUTLIER_NAME = 'kme.vast.outlier';
const METRIC_VAST_INITIAL_NAME = 'kme.vast.initial';
const METRIC_VAST_OPTIMIZATION_NAME = 'kme.vast.optimization';


const TAG_AUTOPLAY_VALUE_MAP = {
  0: 'ad:ctp',
  1: 'ad:autoplay',
};

const RESERVED_TAGS = {
  SCOPE: '__scope',
};

class DatadogService {

  constructor(logger) {
    let environment = process.env.NODE_ENV;

    if (whitelabel) {
      environment += `-${whitelabel}`;
    }

    this.logger = logger;
    this.agent = new StatsD({
      host: getConfigParameter('DATADOG_AGENT_HOST'),
      port: getConfigParameter('DATADOG_AGENT_PORT'),
      globalTags: [`env:${environment}`],
    });

    // eslint-disable-next-line no-unused-vars
    this.agent.socket.on('error', (error) => {
      // TODO: Consider getting a logger to log this error
    });
  }

  increment(metricName, tags = []) {
    // TODO: Let's add a "command" field to this log to make it easier to find it
    this.logger.debug(`Metric incremented :: ${metricName} ${tags.join(' ')}`);
    return this.agent.increment(metricName, tags);
  }

  close() {
    this.agent.close();
  }

}


// TODO Let's pass config to constructor, it will be well tested then. see DI
class Metrics {
  // NOTE: See hot-shots API at https://github.com/brightcove/hot-shots/
  // NOTE: Datadog agent should be additionally configured with a valid API_KEY
  constructor(agentService) {
    // @TODO: make it a static property
    this.RESERVED_TAGS = RESERVED_TAGS;
    this.agent = agentService;
  }

  vastOptimization(context, tags = {}) {
    const currentVendor = mapUrlToVendorTagValue(context.currentVastUrl || context.vastUrl);

    const extendedTags = _.assign({
      vendor: currentVendor,
    }, tags);

    this.agent.increment(METRIC_VAST_OPTIMIZATION_NAME, this._combineAllMetricTags(context, extendedTags));
  }

  vastInitial(context, tags = {}) {
    const adType = context.initialLoadSuccess ?
      context.initialAdType || AD_TYPES.UNKNOWN : AD_TYPES.ERROR_LOAD;

    const extendedTags = _.assign({
      type: adType,
      vendor: mapUrlToVendorTagValue(context.initialVastUrl),
    }, tags);

    this.agent.increment(METRIC_VAST_INITIAL_NAME, this._combineAllMetricTags(context, extendedTags));
  }

  vastOutlier(context, tags = {}) {
    const metricScope = tags[RESERVED_TAGS.SCOPE];

    const basicMetricTags = {
      type: metricScope,
    };

    this.agent.increment(METRIC_VAST_OUTLIER_NAME, this._combineAllMetricTags(context, basicMetricTags));
    // @TODO: if metricScope is defined, additionally trigger `kme.vast.outlier.${metricScope}` metric
  }

  vastRequest(context, tags) {
    const extendedTags = {
      browser: context.browserName,
      os: context.osName,
      ...tags,
    };

    this.agent.increment(METRIC_VAST_REQUEST_NAME, this._combineAllMetricTags(context, extendedTags));
  }

  vastCreative(context, tags) {
    const finalVendor = mapUrlToVendorTagValue(context.currentVastUrl || context.vastUrl);

    const extendedTags = _({
      type: detectControlGroup(context),
      vendor: finalVendor,
      apos: context.adPosition || 0,
    }).assign(tags).value();

    this.agent.increment(METRIC_VAST_CREATIVE_NAME, this._combineAllMetricTags(context, extendedTags));
  }

  vastCreativeOtt(context, tags) {
    const metricIsSentFlagPath = ['__metrics', METRIC_VAST_CREATIVE_OTT_NAME, 'isSent'];
    const isMetricSent = _.get(context, metricIsSentFlagPath, false);

    // FIXME: This is a workaround. Update code to not send the metric twice and remove this 'isMetricSent' code.
    // prevent sending this metric multiple times for same context
    if (isMetricSent) {
      return;
    }

    const extendedTags = _.extend({
      type: detectVastTagType(context),
      action: 'undefined',
      vendor: context.mediaVendor,
    }, tags);

    _.set(context, metricIsSentFlagPath, true);

    this.agent.increment(METRIC_VAST_CREATIVE_OTT_NAME, this._combineAllMetricTags(context, extendedTags));
  }

  vastBlockedRequest(context, tags) {
    this.agent.increment(METRIC_VAST_BLOCKED_REQUEST_NAME, this._combineAllMetricTags(context, tags));
  }

  vastUniqueRequest(context, tags) {
    this.agent.increment(METRIC_VAST_UNIQUE_REQUEST_NAME, this._combineAllMetricTags(context, tags));
  }

  vastRedirectRequest(context, tags) {
    this.agent.increment(METRIC_VAST_REDIRECT_REQUEST_NAME, this._combineAllMetricTags(context, tags));
  }

  vastAbRequest(context, tags) {
    const extendedTags = _({}).extend(tags, {
      apos: context.adPosition || 0,
      vendor: mapUrlToVendorTagValue(context.currentVastUrl || ''),
      type: detectControlGroup(context),
    }).value();

    this.agent.increment(METRIC_VAST_AB_REQUEST_NAME, this._combineAllMetricTags(context, extendedTags));
  }

  vastWoRequest(context, tags = {}) {
    const extendedTags = {
      wr_mt: context.query.wr_mt,
      status: context.vastWrapperApplied ? 'error' : 'success',
      browser: context.browserName,
      os: context.osName,
      ...tags,
    };
    this.agent.increment(METRIC_VAST_WO_REQUEST_NAME, this._combineAllMetricTags(context, extendedTags));
  }

  // TODO: Update lint configuration to support underscore "private" methods
  // eslint-disable-next-line class-methods-use-this
  _combineAllMetricTags(context, tags) {
    return [...this._flattenTags(this._optimizeVendorTags(tags)), ...this._contextTags(context)];
  }

  // eslint-disable-next-line class-methods-use-this
  _optimizeVendorTags(tags) {
    const optimizedTags = { ...tags };

    Object.keys(optimizationMap)
      .forEach((optimizationTagName) => {
        if (optimizedTags[optimizationTagName]) {
          optimizedTags[optimizationTagName] = optimizationMap[optimizationTagName](optimizedTags[optimizationTagName]);
        }
      });

    return optimizedTags;
  }

  // eslint-disable-next-line class-methods-use-this
  _flattenTags(tags = {}) {
    const tagsArray = [];
    Object.keys(tags).forEach((key) => {
      const value = tags[key];
      if (value !== undefined) {
        tagsArray.push(`${key}:${value}`);
      }
    });
    return tagsArray;
  }

  // eslint-disable-next-line class-methods-use-this
  _contextTags(context) {
    const tags = [];

    tags.push(`cid:${context.clientId}`);

    if (context.konduitAutoplay) {
      const tag = TAG_AUTOPLAY_VALUE_MAP[context.konduitAutoplay];

      if (tag) {
        tags.push(tag);
      }
    }

    return tags;
  }

  destroy() {
    if (this.agent) {
      this.agent.close();
    }
  }
}

// @TODO: use logger instance injection principles here
const datadogService = new DatadogService(loggerService);
module.exports = new Metrics(datadogService);
