'use strict';

const libxmljs = require('libxmljs');
const request = require('supertest');
const expect = require('expect');

const app = require('../../src/app');

const vastTestUrl = 'https://kme-vast-sample.s3.amazonaws.com/vast_with_vpaid_clones/just_test_vast3.0.xml';

const parseAdParameters = (adParametersElement) => {
  const adParametersJsonString = adParametersElement && adParametersElement.text();

  let adParametersJson = null;
  try {
    adParametersJson = JSON.parse(adParametersJsonString);
  } catch (e) { } // eslint-disable-line

  return adParametersJson;
};

const woParams = {
  c1: 'test_c1',
  pi: 'test_pi',
  ci: '333756',
};

describe('/vast API vpaid wrapper', () => {
  describe('VPAID wrapper AdParameters check', () => {
    it('should be with mediaFiles array in AdParameters', () => {
      return request(app)
        .get(`/1/vps?ci=test&origVast=${vastTestUrl}`)
        .expect(200)
        .then((res) => {
          const xmlDoc = libxmljs.parseXml(res.text);
          const adParamsData = parseAdParameters(xmlDoc.get('.//AdParameters'));

          const mediaFiles = adParamsData.mediaFiles;

          expect(mediaFiles).toExist();
          expect(mediaFiles).toBeA(Array);
          expect(mediaFiles[0]).toBeA(Object);
        });
    });

    it('should be with required attributes in mediaFiles in AdParameters', () => {
      return request(app)
        .get(`/1/vps?ci=test&origVast=${vastTestUrl}`)
        .expect(200)
        .then((res) => {
          const xmlDoc = libxmljs.parseXml(res.text);
          const adParamsData = parseAdParameters(xmlDoc.get('.//AdParameters'));

          const mediaFiles = adParamsData.mediaFiles;

          mediaFiles.forEach((mediaFile) => {
            expect(mediaFile.type).toExist();
            expect(mediaFile.width).toExist();
            expect(mediaFile.height).toExist();
            expect(mediaFile.url).toExist();
          });
        });
    });

    it('should be with all query parameters in `p` in AdParameters', () => {
      const queryParameters = Object.keys(woParams)
        .map(key => `${key}=${woParams[key]}`)
        .join('&');

      return request(app)
        .get(`/1/vps?${queryParameters}&origVast=${vastTestUrl}`)
        .expect(200)
        .then((res) => {
          const xmlDoc = libxmljs.parseXml(res.text);
          const adParamsData = parseAdParameters(xmlDoc.get('.//AdParameters'));

          const pageSpeedScriptParameters = adParamsData.p;

          Object.keys(woParams)
            .forEach((key) => {
              expect(pageSpeedScriptParameters[key]).toBe(woParams[key]);
            });

          expect(pageSpeedScriptParameters.oz_flash_id).toExist();
        });
    });

    it('should be with custom_parameter from query parameters in `p` in AdParameters', () => {
      return request(app)
        .get(`/1/vps?ci=test&custom_parameter=test&origVast=${vastTestUrl}`)
        .expect(200)
        .then((res) => {
          const xmlDoc = libxmljs.parseXml(res.text);
          const adParamsData = parseAdParameters(xmlDoc.get('.//AdParameters'));

          expect(adParamsData.p.custom_parameter).toBe('test');
        });
    });
  });
});
