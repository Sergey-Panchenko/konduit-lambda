'use strict';

const expect = require('expect');
const libxml = require('libxmljs');

const PixelTag = require('../../src/tracking/PixelTag');

const emptyVast = '<VAST><Ad></Ad></VAST>';

const assertPixelType = (type, pixel) => {
  // TODO: Need to find alternative for 'toBeAn' comparison
  // expect(pixel).toBeAn(libxml.Element);
  expect(pixel.name()).toEqual(type);
};

describe('PixelTag class', () => {
  it.skip('#constructor', () => {
    it('should throw TypeError if no documentContext provided', () => {
      const cast = () => new PixelTag({});

      expect(cast).toThrow(TypeError);
    });

    it('should throw TypeError if no pixel type provided', () => {
      const xmlDoc = libxml.parseXml(emptyVast);
      const cast = () => new PixelTag({ documentContext: xmlDoc });

      expect(cast).toThrow(TypeError);
    });

    it('should throw TypeError if unsupported pixel type provided', () => {
      const xmlDoc = libxml.parseXml(emptyVast);
      const cast = () => new PixelTag({
        documentContext: xmlDoc,
        type: 'weird',
      });

      expect(cast).toThrow(TypeError);
    });

    it.skip('should build libxml.Element if document and type are valid', () => {
      // const xmlDoc = libxml.parseXml(emptyVast);
      // const tag = new PixelTag({
      //   documentContext: xmlDoc,
      //   type: PixelTag.TYPES.IMPRESSION,
      // });

      // TODO: Replace the 'toBeAn' comparison
      // expect(tag).toBeAn(libxml.Element);
    });

    it.skip('should build specific VAST element for every valid type', () => {
      const documentContext = libxml.parseXml(emptyVast);
      const buildPixel = type => new PixelTag({ documentContext, type });

      Object.keys(PixelTag.TYPES).forEach((typeKey) => {
        const typeValue = PixelTag.TYPES[typeKey];
        it(typeKey, () => assertPixelType(typeValue, buildPixel(typeValue)));
      });
    });

    it('should contain CDATA encoded url as content', () => {
      const xmlDoc = libxml.parseXml(emptyVast);
      const pixel = new PixelTag({
        documentContext: xmlDoc,
        type: PixelTag.TYPES.IMPRESSION,
        host: '//example.com',
      });

      const pixelString = pixel.toString();
      const testResult = /<!\[CDATA\[(https?:)?\/\/(.*)?\]\]>/i.test(pixelString);
      expect(testResult).toEqual(true, `${pixelString} should have a CDATA encoded url`);
    });

    it('should add custom attributes to pixel xml Element', () => {
      const xmlDoc = libxml.parseXml(emptyVast);
      const pixel = new PixelTag({
        documentContext: xmlDoc,
        type: PixelTag.TYPES.IMPRESSION,
        host: '//example.com',
        attributes: {
          hello: 'world',
          foo: 'bar',
          baz: 123,
        },
      });

      const pixelString = pixel.toString();
      const tests = [
        /<Impression .*?hello="world".*?>/i.test(pixelString),
        /<Impression .*?foo="bar".*?>/i.test(pixelString),
        /<Impression .*?baz="123".*?>/i.test(pixelString),
      ];

      expect(tests.every(x => x)).toEqual(true);
    });
  });

  it.skip('static constructors', () => {
    const documentContext = libxml.parseXml(emptyVast);
    const host = '//example.com';

    it('#createImpression should create Impression element', () => {
      const pixel = PixelTag.createImpression({ documentContext, host });

      assertPixelType(PixelTag.TYPES.IMPRESSION, pixel);
    });

    it('#createClickThrough should create ClickThrough element', () => {
      const pixel = PixelTag.createClickThrough({ documentContext, host });

      assertPixelType(PixelTag.TYPES.CLICK_THROUGH, pixel);
    });

    it('#createClickTracking should create ClickTracking element', () => {
      const pixel = PixelTag.createClickTracking({ documentContext, host });

      assertPixelType(PixelTag.TYPES.CLICK_TRACKING, pixel);
    });

    it('#createError should create Error element', () => {
      const pixel = PixelTag.createError({ documentContext, host });

      assertPixelType(PixelTag.TYPES.ERROR, pixel);
    });

    it('#createTrackingEvent should create Tracking element', () => {
      const pixel = PixelTag.createTrackingEvent({ documentContext, host });

      assertPixelType(PixelTag.TYPES.TRACKING_EVENT, pixel);
    });

    it('#createTrackingEvent should add `eventType` property value as attribute `event`', () => {
      const pixel = PixelTag.createTrackingEvent({ documentContext, host, eventType: 'click' });

      expect(pixel.getAttribute('event').value()).toEqual('click');
    });

    it('#createTrackingEvent should keep adding custom attributes', () => {
      const pixel = PixelTag.createTrackingEvent({
        documentContext,
        host,
        eventType: 'click',
        attributes: { hello: 'world' },
      });

      expect(pixel.getAttribute('event').value()).toEqual('click');
      expect(pixel.getAttribute('hello').value()).toEqual('world');
    });
  });
});
