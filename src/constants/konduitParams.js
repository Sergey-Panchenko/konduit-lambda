'use strict';

const konduitParams = Object.freeze(Object.assign(
  {
    KONDUIT_URL: 'konduit_url',
    KONDUIT_ID: 'konduit_id',
    KONDUIT_PARENT_REQUEST_ID: 'konduit_parent_request_id',
    KONDUIT_AB_TESTING: 'konduit_ab_testing',
    KONDUIT_AUTOPLAY: 'konduit_autoplay',
    KONDUIT_OPTIMIZE: 'konduit_optimize',
    KONDUIT_OTT: 'konduit_ott',
    KONDUIT_AB_TYPE: 'konduit_ab_type',
    KONDUIT_VPAID_WRAPPER: 'konduit_vpaid_wrapper',
    KONDUIT_PARTNER_MEDIA_URL: 'mediaUrl',
    KONDUIT_PARTNER_CLICK_URL: 'clickUrl',
    WO_ORIGINAL_VAST: 'origVast',
  },
));

module.exports = konduitParams;
