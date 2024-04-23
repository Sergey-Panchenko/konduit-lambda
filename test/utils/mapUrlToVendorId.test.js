'use strict';

const expect = require('expect');

const { mapUrlToVendorId } = require('../../src/utils/mapUrlToVendorName');

const expectedResults = [
  { vendor: 'one-video-js', adUrl: ['http://redir.adap.tv/redir/javascript/jsvpaid.js'] },
  { vendor: 'one-video-o2-js', adUrl: ['http://acds.prod.vidible.tv/o2shim?companionId=&cpmPassback=&placementId=555537&orgId=3679&injectCompanionDummy=&pauseOnClick=&d.vw=&d.app='] },
  { vendor: 'eyeblaster', adUrl: ['https://secure-ds.serving-sys.com/BurstingCachedScripts/VPAID/HTML5_1_22_0_0/VPAIDAPI.js'] },
  { vendor: 'springserve', adUrl: ['http://cdn.springserve.com/vd/vd0.2.90.2.js'] },
  { vendor: 'innovid', adUrl: ['https://s-cdn.innovid.com/3.45.13719/platform/vpaid/VPAIDIRollPackage.swf?configURL=https%3A%2F%2Fs-static.innovid.com%2Firoll%2Fconfig%2F1i1e6s.xml%3Fcb%3Da67477a9-0c9c-9417-08db-97bdb444563d&secure=true&ivc=%5Becp%5D'] },
  { vendor: 'google-ima', adUrl: ['https://imasdk.googleapis.com/js/sdkloader/vpaid_adapter.js'] },
  { vendor: 'vastx.moatads.com', adUrl: ['http://vastx.moatads.com/abchulufreewheel10298472946/template.xml?vast_url=http%3A%2F%2Frtr.innovid.com%2Fr1.599ea2eea901b1.87428687%3Bcb%3D995751404&ad_duration=00%3A00%3A30&ad_width=0&ad_height=0&ad_title=2934431&level1=422713&level2=19757218&level3=19757224&level4=2934431&slicer1=g944924&slicer2=1513212&zMoatSEID=&tmode=2'] },
  { vendor: 'spotxchange', adUrl: ['https://search.spotxchange.com/vast/2.0/85394?VPAID=SWF&content_page_url=__page-url__&cb=__random-number__&player_width=__player-width__&player_height=__player-height__'] },
  { vendor: 'videology', adUrl: ['https://req.tidaltv.com/vmm.ashx?mt=1&xf=12&pid=2742&ap=0&rand=26980695&refUrl=trendingvideos.myspace.com%2Fvideo%2F394%2F1859843%2Fvideo-of-the-day'] },
  { vendor: 'one-video', adUrl: ['http://ads.adaptv.advertising.com/a/h/_2JTaTCrWEZu05rUrd8U8P0SxzR0HV7U?cb=25442231769620931&pageUrl=http://groovyhistory.com/rare-photos-reveal-a-different-side-to-groovy-history/19&duration=79232&id=5996666f92fdde6fdff6b978&title=Never%20chunk%20a%20chip%20shot%20again&eov=eov'] },
  { vendor: 'none', adUrl: ['invalid url'] },
  { vendor: 'none', adUrl: ['', null, undefined, 0] },
];

describe('mapUrlToVendorId util', () => {
  expectedResults.forEach((expectation) => {
    const { vendor, adUrl } = expectation;

    it(`should map "${vendor}" vendor correctly`, () => {
      adUrl.forEach((url) => {
        expect(mapUrlToVendorId(url)).toEqual(vendor);
      });
    });
  });
});
