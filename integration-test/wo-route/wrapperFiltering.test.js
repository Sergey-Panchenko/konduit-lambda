'use strict';

const libxmljs = require('libxmljs');
const request = require('supertest');
const expect = require('expect');

const app = require('../../src/app');

const getConfigParameter = require('../../src/utils/getConfigParameter');

const KONDUIT_VPAID_WRAPPER_MEDIA_ID = 'vpaid-wrapper';
const vpaidWrapperUrl = getConfigParameter('VPAID_WRAPPER_URL');

const vastTestUrl = 'https://kme-vast-sample.s3.amazonaws.com/vast_with_vpaid_clones/just_test_vast3.0.xml';

describe('/vast API wrapper filtering', () => {
  it('should receive VAST without VPAID wrapper when wr_mt=1', () => {
    return request(app)
      .get(`/1/vps?ci=test&wr_mt=1&origVast=${vastTestUrl}`)
      .expect(200)
      .then((res) => {
        const xmlDoc = libxmljs.parseXml(res.text);
        const vpaidWrapperMediaFile = xmlDoc.get(`.//MediaFile[@id='${KONDUIT_VPAID_WRAPPER_MEDIA_ID}']`);
        const mediaFiles = xmlDoc.find('.//MediaFile');

        expect(vpaidWrapperMediaFile).toNotExist();
        expect(mediaFiles.length).toBeGreaterThan(1);
      });
  });

  it('should receive VAST with VPAID wrapper without other mediaFiles when wr_mt=2', () => {
    return request(app)
      .get(`/1/vps?ci=test&wr_mt=2&origVast=${vastTestUrl}`)
      .expect(200)
      .then((res) => {
        const xmlDoc = libxmljs.parseXml(res.text);
        const vpaidWrapperMediaFile = xmlDoc.get(`.//MediaFile[@id='${KONDUIT_VPAID_WRAPPER_MEDIA_ID}']`);
        const mediaFiles = xmlDoc.find('.//MediaFile');

        expect(vpaidWrapperMediaFile).toExist();
        expect(vpaidWrapperMediaFile.cdata().text()).toMatch(vpaidWrapperUrl);
        expect(mediaFiles.length).toBe(1);
      });
  });

  it('should receive VAST with VPAID wrapper with other MediaFiles when wr_mt=3' +
    ' with other MediaFiles', () => {
    return request(app)
      .get(`/1/vps?ci=test&wr_mt=3&origVast=${vastTestUrl}`)
      .expect(200)
      .then((res) => {
        const xmlDoc = libxmljs.parseXml(res.text);
        const vpaidWrapperMediaFile = xmlDoc.get(`.//MediaFile[@id='${KONDUIT_VPAID_WRAPPER_MEDIA_ID}']`);
        const mediaFiles = xmlDoc.find('.//MediaFile');

        expect(vpaidWrapperMediaFile).toExist();
        expect(vpaidWrapperMediaFile.cdata().text()).toMatch(vpaidWrapperUrl);
        expect(mediaFiles.length).toBeGreaterThan(1);
      });
  });
});
