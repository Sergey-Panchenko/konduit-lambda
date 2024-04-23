'use strict';

const expect = require('expect');

const isValidDataUrl = require('../../src/utils/isValidDataUrl');

const correctBase64VastTag = 'data:;base64,PFZBU1QgdmVyc2lvbj0iMy4wIj4KPEFkPgo8SW5MaW5lPgo8QWRTeXN0ZW0+eTJmaHBkd1FtbEtzSVRJbTwvQWRTeXN0ZW0+CjxBZFRpdGxlPnRlc3QgMDAxPC9BZFRpdGxlPgo8RGVzY3JpcHRpb24+Ck9uZSBWUEFJRCBqcyBpbiBvbmUgQ3JlYXRpdmUgTGluZWFyIEFsbCByZXF1aXJlZCBlbGVtZW50cyBhbmQgYXR0cmlidXRlcyBvbmx5CjwvRGVzY3JpcHRpb24+CjxJbXByZXNzaW9uPgo8IVtDREFUQVsgaHR0cDovL215VHJhY2tpbmdVUkwvd3JhcHBlci9pbXByZXNzaW9uIF1dPgo8L0ltcHJlc3Npb24+CjxDcmVhdGl2ZXM+CjxDcmVhdGl2ZT4KPExpbmVhcj4KPER1cmF0aW9uPjAwOjAwOjMwPC9EdXJhdGlvbj4KPEFkUGFyYW1ldGVycz4KPCFbQ0RBVEFbCnsidmlkZW9zIjpbIHsidXJsIjoiLy9zMy5hbWF6b25hd3MuY29tL2RlbW8uandwbGF5ZXIuY29tL3BsYXllci1kZW1vcy9hc3NldHMvcHJlcm9sbC5tcDQiLCJtaW1ldHlwZSI6InZpZGVvL21wNCJ9XSwgImF0dHJpYnV0ZXMiOiB7ICJkZXNpcmVkQml0cmF0ZSIgOiAyNTYsICJkdXJhdGlvbiIgOiAzMCwgImV4cGFuZGVkIiA6IGZhbHNlLCAiaGVpZ2h0IiA6IDAsICJpY29ucyIgOiAiIiwgImxpbmVhciIgOiB0cnVlLCAicmVtYWluaW5nVGltZSIgOiAzMCwgInNraXBwYWJsZVN0YXRlIiA6IHRydWUsICJ2aWV3TW9kZSIgOiAibm9ybWFsIiwgIndpZHRoIiA6IDAsICJ2b2x1bWUiIDogMS4wIH0gfQpdXT4KPC9BZFBhcmFtZXRlcnM+CjxNZWRpYUZpbGVzPgo8TWVkaWFGaWxlIGRlbGl2ZXJ5PSJwcm9ncmVzc2l2ZSIgd2lkdGg9IjY0MCIgaGVpZ2h0PSIzNjAiIGFwaUZyYW1ld29yaz0iVlBBSUQiIHR5cGU9ImFwcGxpY2F0aW9uL2phdmFzY3JpcHQiPgo8IVtDREFUQVsKaHR0cHM6Ly9zMy51cy1lYXN0LTIuYW1hem9uYXdzLmNvbS9rbWUtdmFzdC1zYW1wbGUvbWVkaWEvdnBhaWQtMi1wbGF5ZXItdGVzdC5qcwpdXT4KPC9NZWRpYUZpbGU+CjwvTWVkaWFGaWxlcz4KPC9MaW5lYXI+CjwvQ3JlYXRpdmU+CjwvQ3JlYXRpdmVzPgo8L0luTGluZT4KPC9BZD4KPC9WQVNUPg==';// eslint-disable-line
const wrongBase64VastTag = 'data:;base64,CjwvQ3JlYXRpdmVzPgo8L0luTGluZT4KPC9BZD4KPC9Wg';// eslint-disable-line
const correctEncodedVastTag = `data:,<VAST%20version%3D"3.0">%0A<Ad>%0A<InLine>%0A<AdSystem>y2fhpdwQmlKsITIm<%2FAdSystem>%0A<AdTitle>test%20001<%2FAdTitle>%0A<Description>%0AOne%20VPAID%20js%20in%20one%20Creative%20Linear%20All%20required%20elements%20and%20attributes%20only%0A<%2FDescription>%0A<Impression>%0A<!%5BCDATA%5B%20http%3A%2F%2FmyTrackingURL%2Fwrapper%2Fimpression%20%5D%5D>%0A<%2FImpression>%0A<Creatives>%0A<Creative>%0A<Linear>%0A<Duration>00%3A00%3A30<%2FDuration>%0A<AdParameters>%0A<!%5BCDATA%5B%0A%7B"videos"%3A%5B%20%7B"url"%3A"%2F%2Fs3.amazonaws.com%2Fdemo.jwplayer.com%2Fplayer-demos%2Fassets%2Fpreroll.mp4"%2C"mimetype"%3A"video%2Fmp4"%7D%5D%2C%20"attributes"%3A%20%7B%20"desiredBitrate"%20%3A%20256%2C%20"duration"%20%3A%2030%2C%20"expanded"%20%3A%20false%2C%20"height"%20%3A%200%2C%20"icons"%20%3A%20""%2C%20"linear"%20%3A%20true%2C%20"remainingTime"%20%3A%2030%2C%20"skippableState"%20%3A%20true%2C%20"viewMode"%20%3A%20"normal"%2C%20"width"%20%3A%200%2C%20"volume"%20%3A%201.0%20%7D%20%7D%0A%5D%5D>%0A<%2FAdParameters>%0A<MediaFiles>%0A<MediaFile%20delivery%3D"progressive"%20width%3D"640"%20height%3D"360"%20apiFramework%3D"VPAID"%20type%3D"application%2Fjavascript">%0A<!%5BCDATA%5B%0Ahttps%3A%2F%2Fs3.us-east-2.amazonaws.com%2Fkme-vast-sample%2Fmedia%2Fvpaid-2-player-test.js%0A%5D%5D>%0A<%2FMediaFile>%0A<%2FMediaFiles>%0A<%2FLinear>%0A<%2FCreative>%0A<%2FCreatives>%0A<%2FInLine>%0A<%2FAd>%0A<%2FVAST>`;// eslint-disable-line

describe('isValidDataUrl util', () => {
  it('should validate base64 dataURL', () => {
    expect(isValidDataUrl(correctBase64VastTag)).toBe(true);
  });

  it('should validate uri encoded dataURL', () => {
    expect(isValidDataUrl(correctEncodedVastTag)).toBe(true);
  });

  it('should not validate wrong base64 dataURL', () => {
    expect(isValidDataUrl(wrongBase64VastTag)).toBe(false);
  });

  it('should not validate empty dataURL', () => {
    expect(isValidDataUrl()).toBe(false);
  });

  it('should not validate empty string', () => {
    expect(isValidDataUrl('')).toBe(false);
  });

  it('should not validate passed null', () => {
    expect(isValidDataUrl(null)).toBe(false);
  });
});
