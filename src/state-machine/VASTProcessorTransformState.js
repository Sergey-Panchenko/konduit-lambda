'use strict';

const AbstractState = require('./AbstractState');
const VASTProcessorRoutingState = require('./VASTProcessorRoutingState');

const metrics = require('../utils/metrics');
const containsMediaTypes = require('../utils/containsMediaTypes');

class VASTProcessorTransformState extends AbstractState {
  constructor(stateName = VASTProcessorTransformState.STATE_NAME) {
    super(stateName);
  }

  run(context) {
    super.run(context);

    this.prepareVast();

    context.setState(new VASTProcessorRoutingState());
  }

  static isExtraVpaid(mediaFiles) {
    const mediaTypesToCheck = ['video', 'javascript'];
    return containsMediaTypes({ mediaFiles, mediaTypes: mediaTypesToCheck });
  }

  // eslint-disable-next-line class-methods-use-this
  prepareVast() {
    // const mediaFiles = this.getContext().xmlDoc.find('.//MediaFile');
    // this.removeVpaid(mediaFiles);
  }

  removeVpaid(mediaFiles) {
    if (!VASTProcessorTransformState.isExtraVpaid(mediaFiles)) return;
    let vpaidStr;
    mediaFiles.forEach((mf) => {
      const apiFramework = mf.getAttribute('apiFramework');
      if (apiFramework && apiFramework.value().toLowerCase() === 'vpaid') {
        vpaidStr = mf.toString();
        mf.remove();
      }
    });
    if (vpaidStr) {
      metrics.vastOutlier(this.getContext(), {
        [metrics.RESERVED_TAGS.SCOPE]: 'vpaid-remove',
      });
    }
  }
}

VASTProcessorTransformState.STATE_NAME = '3:Transform';

module.exports = VASTProcessorTransformState;
