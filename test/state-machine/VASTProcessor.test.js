'use strict';

/* eslint no-unreachable: 0 */

const expect = require('expect');
const querystring = require('querystring');
const moment = require('moment');

const VASTProcessor = require('../../src/state-machine/VASTProcessor');
const AbstractState = require('../../src/state-machine/AbstractState');

const MockLogger = require('../helpers/mockLogger');

describe('VASTProcessor state', () => {
  beforeEach(() => {
    AbstractState.LOGGER = new MockLogger({ silent: true });
  });

  describe('#forwardFirstVASTResponse', () => {
    it('should call #forwardResponse with first vast response data', () => {
      const params = querystring.stringify({
        konduit_url: 'http://example.com',
        konduit_id: 123,
      });

      const vastProcessor = new VASTProcessor({
        originalUrl: `/api/vastProxy?${params}`,
      });

      vastProcessor._firstVASTResponse = {}; // eslint-disable-line no-underscore-dangle
      vastProcessor._firstVASTBody = ''; // eslint-disable-line no-underscore-dangle

      const forwardResponseSpy = expect.spyOn(vastProcessor, 'forwardResponse');

      vastProcessor.forwardFirstVASTResponse();

      expect(forwardResponseSpy)
        .toHaveBeenCalledWith(
          vastProcessor._firstVASTResponse, // eslint-disable-line no-underscore-dangle
          vastProcessor._firstVASTBody // eslint-disable-line no-underscore-dangle
        );
    });
  });

  describe('#redirectToInitialVastUrl', () => {
    it('should send redirect response it initialUrl', () => {
      const initialUrl = 'http://example.com/path/to/vast.xml';

      const params = querystring.stringify({
        konduit_url: initialUrl,
        konduit_id: 123,
      });

      const vastProcessor = new VASTProcessor({
        originalUrl: `/api/vastProxy?${params}`,
        headers: {
          'x-cookie': 'cookie_key1=value1; cookie_key2=value2; ',
        },
        cookies: {},
        xCookies: { cookie_key1: 'value1', cookie_key2: 'value2' },
      });

      const redirectSpy = expect.spyOn(vastProcessor, 'emitError');
      vastProcessor.start();

      vastProcessor.redirectToInitialVastUrl();

      expect(redirectSpy).toHaveBeenCalled();
      expect(redirectSpy).toHaveBeenCalledWith(302);
    });
  });

  describe('#addSetCookie', () => {
    const params = querystring.stringify({
      konduit_url: 'http://example.com/',
      konduit_id: 123,
    });

    let vastProcessor;

    beforeEach(() => {
      vastProcessor = new VASTProcessor({
        originalUrl: `/api/vastProxy?${params}`,
        headers: {
          'x-cookie': 'cookie_key1=value1; cookie_key2=value2; ',
        },
        cookies: {
          cookie_key1: 'value1',
          cookie_key2: 'value2',
        },
        xCookies: { cookie_key1: 'value1', cookie_key2: 'value2' },
      });
      vastProcessor.start();
    });

    it('should add cookie via set-cookie header', () => {
      const setCookieHeader1 = ['cookie_key3=value3; '];
      vastProcessor.addSetCookie(setCookieHeader1);

      expect(vastProcessor.cookies).toEqual({
        cookie_key1: 'value1',
        cookie_key2: 'value2',
        cookie_key3: 'value3',
      });

      expect(vastProcessor.collectedSetCookieHeaders).toEqual(setCookieHeader1);

      const setCookieHeader2 = ['cookie_key3=value31; ', 'cookie_key4=value4;'];
      vastProcessor.addSetCookie(setCookieHeader2);

      expect(vastProcessor.cookies).toEqual({
        cookie_key1: 'value1',
        cookie_key2: 'value2',
        cookie_key3: 'value31',
        cookie_key4: 'value4',
      });

      expect(vastProcessor.collectedSetCookieHeaders)
        .toEqual([...setCookieHeader1, ...setCookieHeader2]);
    });

    describe('Expires', () => {
      it('should add cookie if Expires in future', () => {
        const featureDate = moment().add(1, 'day').toDate().toUTCString();
        const featureSetCookie = `cookie_key3=value3; Expires=${featureDate}`;
        vastProcessor.addSetCookie([featureSetCookie]);

        expect(vastProcessor.cookies).toEqual({
          cookie_key1: 'value1',
          cookie_key2: 'value2',
          cookie_key3: 'value3',
        });

        expect(vastProcessor.collectedSetCookieHeaders).toEqual([featureSetCookie]);
      });

      it('should not add cookie if expired', () => {
        const pastDate = moment().subtract(1, 'day').toDate().toUTCString();
        const nowDate = moment().toDate().toUTCString();
        const pastSetCookies = [`cookie_key3=value31; Expires=${pastDate}`, `cookie_key4=value4; Expires=${nowDate}`];
        vastProcessor.addSetCookie(pastSetCookies);

        expect(vastProcessor.cookies).toEqual({
          cookie_key1: 'value1',
          cookie_key2: 'value2',
        });

        expect(vastProcessor.collectedSetCookieHeaders).toEqual([...pastSetCookies]);
      });
    });

    describe('Max-Age', () => {
      it('should add cookie if Max-Age gt than zero', () => {
        const featureMaxAge = 1;
        const featureSetCookie = [`cookie_key3=value3; Max-Age=${featureMaxAge}`];
        vastProcessor.addSetCookie(featureSetCookie);

        expect(vastProcessor.cookies).toEqual({
          cookie_key1: 'value1',
          cookie_key2: 'value2',
          cookie_key3: 'value3',
        });

        expect(vastProcessor.collectedSetCookieHeaders).toEqual(featureSetCookie);
      });

      it('should not add cookie if expired', () => {
        const pastSetCookies = [
          'cookie_key3=value3; Max-Age=0',
          'cookie_key4=value4; Max-Age=-1',
        ];
        vastProcessor.addSetCookie(pastSetCookies);

        expect(vastProcessor.cookies).toEqual({
          cookie_key1: 'value1',
          cookie_key2: 'value2',
        });

        expect(vastProcessor.collectedSetCookieHeaders).toEqual(pastSetCookies);
      });

      it('should have precedence with Expires', () => {
        const featureMaxAge = 1;
        const pastDate = moment().subtract(1, 'day').toDate().toUTCString();
        const featureSetCookie = [`cookie_key3=value3; Max-Age=${featureMaxAge}; Expires=${pastDate}`];
        vastProcessor.addSetCookie(featureSetCookie);

        expect(vastProcessor.cookies).toEqual({
          cookie_key1: 'value1',
          cookie_key2: 'value2',
          cookie_key3: 'value3',
        });

        expect(vastProcessor.collectedSetCookieHeaders).toEqual(featureSetCookie);

        const featureDate = moment().add(1, 'day').toDate().toUTCString();
        const pastSetCookies = [
          `cookie_key3=value3; Max-Age=0; Expires=${featureDate}`,
          `cookie_key4=value4; Max-Age=-1; Expires=${featureDate}`,
        ];
        vastProcessor.addSetCookie(pastSetCookies);

        expect(vastProcessor.cookies).toEqual({
          cookie_key1: 'value1',
          cookie_key2: 'value2',
          cookie_key3: 'value3',
        });

        expect(vastProcessor.collectedSetCookieHeaders).toEqual([...featureSetCookie, ...pastSetCookies]);
      });
    });
  });
});
