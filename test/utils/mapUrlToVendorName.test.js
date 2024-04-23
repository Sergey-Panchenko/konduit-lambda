'use strict';

const expect = require('expect');

const { mapUrlToVendorName } = require('../../src/utils/mapUrlToVendorName');

const expectedResults = [
  { vendor: 'One Video JS', adUrl: ['http://redir.adap.tv/redir/javascript/jsvpaid.js'] },
  { vendor: 'One Video O2 JS', adUrl: ['http://acds.prod.vidible.tv/o2shim?companionId=&cpmPassback=&placementId=555537&orgId=3679&injectCompanionDummy=&pauseOnClick=&d.vw=&d.app='] },
  { vendor: 'EyeBlaster', adUrl: ['https://secure-ds.serving-sys.com/BurstingCachedScripts/VPAID/HTML5_1_22_0_0/VPAIDAPI.js'] },
  { vendor: 'SpringServe', adUrl: ['http://cdn.springserve.com/vd/vd0.2.90.2.js'] },
  { vendor: 'Innovid', adUrl: ['https://s-cdn.innovid.com/3.45.13719/platform/vpaid/VPAIDIRollPackage.swf?configURL=https%3A%2F%2Fs-static.innovid.com%2Firoll%2Fconfig%2F1i1e6s.xml%3Fcb%3Da67477a9-0c9c-9417-08db-97bdb444563d&secure=true&ivc=%5Becp%5D'] },
  { vendor: 'Google IMA', adUrl: ['https://imasdk.googleapis.com/js/sdkloader/vpaid_adapter.js'] },
  { vendor: 'SpotXChange', adUrl: ['https://search.spotxchange.com/vast/2.0/85394?VPAID=SWF&content_page_url=__page-url__&cb=__random-number__&player_width=__player-width__&player_height=__player-height__'] },
  { vendor: 'vastx.moatads.com', adUrl: ['http://vastx.moatads.com/abchulufreewheel10298472946/template.xml?vast_url=http%3A%2F%2Frtr.innovid.com%2Fr1.599ea2eea901b1.87428687%3Bcb%3D995751404&ad_duration=00%3A00%3A30&ad_width=0&ad_height=0&ad_title=2934431&level1=422713&level2=19757218&level3=19757224&level4=2934431&slicer1=g944924&slicer2=1513212&zMoatSEID=&tmode=2'] },
  { vendor: 'Casalemedia', adUrl: ['http://a1742.casalemedia.com/hello', 'http://a1808.casalemedia.com/hello'] },
  { vendor: 'None', adUrl: ['invalid url'] },
  { vendor: 'None', adUrl: ['', null, undefined, 0] },
];

describe('mapUrlToVendorName util', () => {
  expectedResults.forEach((expectation) => {
    const { vendor, adUrl } = expectation;

    it(`should map "${vendor}" vendor correctly`, () => {
      adUrl.forEach((url) => {
        expect(mapUrlToVendorName(url)).toEqual(vendor);
      });
    });
  });
});
