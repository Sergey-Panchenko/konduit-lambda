'use strict';

const fs = require('fs');
const path = require('path');
const libxml = require('libxmljs');
const expect = require('expect');

const vastInjectTrackingEvents = require('../../src/utils/vastInjectTrackingEvents');

const fixturesPath = path.join(__dirname, '../fixtures/merge/tracking-events/');
const loadFixture = fixtureName => fs.readFileSync(path.join(fixturesPath, fixtureName), 'utf8');

const FIXTURES = {
  VAST_INLINE_WITH_TRACKING_EVENTS: loadFixture('inlineFull.xml'),
  VAST_INLINE_WITHOUT_TRACKING_EVENTS: loadFixture('inlineEmpty.xml'),
  VAST_WRAPPER_WITHOUT_TRACKING_EVENTS: loadFixture('wrapperEmpty.xml'),
};

const cleanSpaces = string => string
  .replace('\t', '')
  .replace(/\n */ig, '');

const spawnTrackingEvents = documentContext =>
  ['foo', 'bar', 'baz'].map((str) => {
    const element = new libxml.Element(documentContext, 'Tracking');
    element.text(str);

    return element;
  });

describe('vastInjectTrackingEvents util', () => {
  it('should inject collection into existing TrackingEvents', () => {
    const xmlDoc = libxml.parseXml(FIXTURES.VAST_INLINE_WITH_TRACKING_EVENTS);
    const trackingEvents = spawnTrackingEvents(xmlDoc);
    const vastTag = xmlDoc.get('//VAST');

    vastInjectTrackingEvents(vastTag, trackingEvents);
    const expectedResult = '<VAST version="2.0"><Ad id="inline.xml"><InLine><AdSystem>Test</AdSystem><AdTitle>Test Title</AdTitle><Impression>https://VAST/Ad/inline.xml/Wrapper/Creatives/Creative/Impression</Impression><Creatives><Creative><Linear><Duration>00:00:15</Duration><VideoClicks><ClickThrough>https://VAST/Ad/inline.xml/Wrapper/Creatives/Creative/1/Linear/ClickThrough</ClickThrough><ClickTracking>https://VAST/Ad/inline.xml/Wrapper/Creatives/Creative/1/Linear/ClickTracking</ClickTracking><CustomClick>https://VAST/Ad/inline.xml/Wrapper/Creatives/Creative/1/Linear/CustomClick</CustomClick></VideoClicks><AdParameters><![CDATA[param=inline_param]]></AdParameters><TrackingEvents><Tracking event="start">https://VAST/Ad/inline.xml/Wrapper/Creatives/Creative/1/Linear/TrackingEvents/Tracking/start</Tracking><Tracking event="complete">https://VAST/Ad/inline.xml/Wrapper/Creatives/Creative/1/Linear/TrackingEvents/Tracking/complete</Tracking><Tracking>foo</Tracking><Tracking>bar</Tracking><Tracking>baz</Tracking></TrackingEvents><MediaFiles><MediaFile delivery="progressive" width="16" height="9" type="application/javascript" apiFramework="VPAID">https://VAST/Ad/inline.xml/Wrapper/Creatives/Creative/Linear/MediaFiles/MediaFile</MediaFile></MediaFiles><Attempt>inline_Attempt</Attempt></Linear></Creative></Creatives><Extensions><Extension type="inline_Extension"><ParamA>inline_Extension/ValueA</ParamA><ParamB>inline_Extension/ValueB</ParamB><ParamC>inline_Extension/ValueC</ParamC></Extension></Extensions></InLine></Ad></VAST>';
    expect(cleanSpaces(vastTag.toString())).toEqual(expectedResult);
  });


  it('should create TrackingEvents after MediaFiles element in InLine if it is missing', () => {
    const xmlDoc = libxml.parseXml(FIXTURES.VAST_INLINE_WITHOUT_TRACKING_EVENTS);
    const trackingEvents = spawnTrackingEvents(xmlDoc);
    const vastTag = xmlDoc.get('//VAST');

    vastInjectTrackingEvents(vastTag, trackingEvents);
    const expectedResult = '<VAST version="2.0"><Ad id="inline.xml"><InLine><AdSystem>Test</AdSystem><AdTitle>Test Title</AdTitle><Impression>https://VAST/Ad/inline.xml/Wrapper/Creatives/Creative/Impression</Impression><Creatives><Creative><Linear><Duration>00:00:15</Duration><VideoClicks><ClickThrough>https://VAST/Ad/inline.xml/Wrapper/Creatives/Creative/1/Linear/ClickThrough</ClickThrough><ClickTracking>https://VAST/Ad/inline.xml/Wrapper/Creatives/Creative/1/Linear/ClickTracking</ClickTracking><CustomClick>https://VAST/Ad/inline.xml/Wrapper/Creatives/Creative/1/Linear/CustomClick</CustomClick></VideoClicks><AdParameters><![CDATA[param=inline_param]]></AdParameters><MediaFiles><MediaFile delivery="progressive" width="16" height="9" type="application/javascript" apiFramework="VPAID">https://VAST/Ad/inline.xml/Wrapper/Creatives/Creative/Linear/MediaFiles/MediaFile</MediaFile></MediaFiles><TrackingEvents><Tracking>foo</Tracking><Tracking>bar</Tracking><Tracking>baz</Tracking></TrackingEvents><Attempt>inline_Attempt</Attempt></Linear></Creative></Creatives><Extensions><Extension type="inline_Extension"><ParamA>inline_Extension/ValueA</ParamA><ParamB>inline_Extension/ValueB</ParamB><ParamC>inline_Extension/ValueC</ParamC></Extension></Extensions></InLine></Ad></VAST>';
    expect(cleanSpaces(vastTag.toString())).toEqual(expectedResult);
  });

  it('should create TrackingEvents as first child of Linear in Wrapper if it is missing', () => {
    const xmlDoc = libxml.parseXml(FIXTURES.VAST_WRAPPER_WITHOUT_TRACKING_EVENTS);
    const trackingEvents = spawnTrackingEvents(xmlDoc);
    const vastTag = xmlDoc.get('//VAST');

    vastInjectTrackingEvents(vastTag, trackingEvents);
    const expectedResult = '<VAST version="2.0"><Ad id="wrapper0.xml"><Wrapper><AdSystem>Test</AdSystem><VASTAdTagURI><![CDATA[./wrapper_0.xml]]></VASTAdTagURI><Error>https://VAST/Ad/wrapper0.xml/Wrapper/Creatives/Creative/Error</Error><Impression>https://VAST/Ad/wrapper0.xml/Wrapper/Creatives/Creative/Impression</Impression><Creatives><Creative id="1"><Linear><TrackingEvents><Tracking>foo</Tracking><Tracking>bar</Tracking><Tracking>baz</Tracking></TrackingEvents><Duration>00:00:00</Duration><VideoClicks><ClickTracking>https://VAST/Ad/wrapper0.xml/Wrapper/Creatives/Creative/1/Linear/ClickTracking</ClickTracking></VideoClicks><AdParameters><![CDATA[param=wrapper0_param]]></AdParameters><Attempt>wrapper0_Attempt</Attempt></Linear></Creative></Creatives><Extensions><Extension type="wrapper_0_Extension"><ParamA>wrapper_0_Extension/ValueA</ParamA><ParamB>wrapper_0_Extension/ValueB</ParamB><ParamC>wrapper_0_Extension/ValueC</ParamC></Extension></Extensions></Wrapper></Ad></VAST>';
    expect(cleanSpaces(vastTag.toString())).toEqual(expectedResult);
  });

  it.skip('should return TrackingEvents tag with collection inside', () => {
    const xmlDoc = libxml.parseXml(FIXTURES.VAST_WRAPPER_WITHOUT_TRACKING_EVENTS);
    const trackingEvents = spawnTrackingEvents(xmlDoc);
    const vastTag = xmlDoc.get('//VAST');

    const result = vastInjectTrackingEvents(vastTag, trackingEvents);
    expect(result).toBeA(libxml.Element);
    expect(result.name()).toEqual('TrackingEvents');
  });
});

