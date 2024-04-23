'use strict';

const path = require('path');
const URL = require('url');
const libxmljs = require('libxmljs');
const supertest = require('supertest');
const expect = require('expect');
const nock = require('nock');

const nockBack = nock.back;

const app = require('../../src/app');
const getConfigParameter = require('../../src/utils/getConfigParameter');

const VPAID_WRAPPER_URL = getConfigParameter('VPAID_WRAPPER_URL');
const PIXEL_TRACKER_BASE_URL = getConfigParameter('PIXEL_TRACKER_BASE_URL');

const {
  downloadFile,
  enableNockConnect,
} = require('./util');


describe('Check processed VAST response for provided', () => {
  const testXmlUrlMap = new Map([
    ['vast-3.0-inline-video.xml', 'https://kme-vast-sample.s3.amazonaws.com/vast_with_vpaid_clones/vast-3.0/vast-inline-video-github-3.0.xml'],
    ['vast-2.0-inline-video.xml', 'https://kme-vast-sample.s3.us-east-2.amazonaws.com/vast-inline-ad-video.xml'],
    ['vast-4.1-inline-video.xml', 'https://kme-vast-sample.s3.us-east-2.amazonaws.com/vast-inline-v4.1.xml'],
    ['vast-4.0-inline-vpaid-video.xml', 'https://kme-vast-sample.s3.us-east-2.amazonaws.com/vast_tania_test/Working/vast-inline-4.0-VPAID-videos.xml'],
    ['vast-2.0-wrapper-wrapper-no-ad.xml', 'https://kme-vast-sample.s3.us-east-2.amazonaws.com/vast_tania_test/vast-wrapper-2.0-to-wrapper-3.0-to-no_ad.xml'],
    ['vast-3.0-wrapper-inline-video.xml', 'https://kme-vast-sample.s3.amazonaws.com/vast_with_vpaid_clones/vast-3.0/vast-wrapper-to-inline-video-3.0.xml'],
    ['vast-4.0-wrapper-inline-vpaid.xml', 'https://kme-vast-sample.s3.us-east-2.amazonaws.com/vast_tania_test/Working/vast-wrapper-4.0-to-inline-3.0-VPAID.xml'],
    ['vast-3.0-adpod-inline-video.xml', 'https://kme-vast-sample.s3.us-east-2.amazonaws.com/vast_tania_test/Working/vast-adpod-ad1-inline-ad2-inline.xml'],
  ]);

  // TODO: All tags should be hosted in Konduit AWS cloud
  const essentialInternalRequestHosts = [
    'https://search.spotxchange.com',
  ];

  before(() => {
    nockBack.setMode('record');
    nockBack.fixtures = path.join(__dirname, '/nock-fixtures');
    enableNockConnect([...testXmlUrlMap.values(), ...essentialInternalRequestHosts]);
  });

  const loadAndProcessXml = async (originalXmlUrl) => {
    const originalXmlText = await downloadFile(originalXmlUrl);
    const originalXml = libxmljs.parseXml(originalXmlText);

    const response = await supertest(app)
      .get(`/1/vps?ci=test&origVast=${originalXmlUrl}`)
      .expect(200);

    const processedXml = libxmljs.parseXml(response.text);
    return { originalXml, processedXml };
  };

  after(async () => {
    // FIXME: Incorrect usage of the nockBack recorder -- make use of it
    // const nockFixtureName = 'vast-static-localhost-tracking.xml';
    // const { nockDone } = await nockBack(nockFixtureName);
    // nockDone();
    nock.cleanAll();
    nock.enableNetConnect();
  });

  const testXmlSections = async (originalXmlUrl, { exclude = '', isWrapper = false }) => {
    const { originalXml, processedXml } = await loadAndProcessXml(originalXmlUrl);

    const excludedSectionsArray = exclude.split(' ');

    if (isWrapper) {
      expect().toContainNode(processedXml, './/Wrapper');
    } else {
      expect().toContainNode(processedXml, './/InLine');
    }
    expect().toContainNode(processedXml, './/Creatives');
    expect().toContainNode(processedXml, './/TrackingEvents');

    expect().toContainNodesCount(processedXml, './/Tracking', 11);
    expect().toContainSupersetOfNodes(processedXml, originalXml, './/Tracking');
    expect().toContainNewNodesStartingWith(processedXml, originalXml, './/Tracking', PIXEL_TRACKER_BASE_URL);

    expect().toContainNodesCount(processedXml, './/Impression', 3);
    expect().toContainSupersetOfNodes(processedXml, originalXml, './/Impression');
    expect().toContainNewNodesStartingWith(processedXml, originalXml, './/Impression', PIXEL_TRACKER_BASE_URL);

    if (!excludedSectionsArray.includes('errorOriginal')) {
      const originalErrorText = originalXml.get('.//Error').text().trim();
      const processedErrorText = processedXml.get('.//Error').text().trim();
      const { host, protocol } = URL.parse(originalErrorText);
      const encodedError = encodeURIComponent(`${protocol}//${host}`);
      expect(processedErrorText.startsWith(`${PIXEL_TRACKER_BASE_URL}/error?url=${encodedError}`)).toBeTruthy();
    } else if (!excludedSectionsArray.includes('errorProcessed')) {
      expect().toContainNode(processedXml, './/Error');
    }

    expect().toContainNodesCount(processedXml, './/MediaFile', 2);
    expect().toContainSupersetOfNodes(processedXml, originalXml, './/MediaFile');
    expect().toContainNewNodesStartingWith(processedXml, originalXml, './/MediaFile', VPAID_WRAPPER_URL);

    // if (!exclude.includes('mediaFile')) {
    //   const mediaFile = processedXml.get('.//MediaFile[@id=\'vpaid-wrapper\']');
    //   expect(mediaFile).toBeTruthy();
    //   expect(mediaFile.text().trim().startsWith(VPAID_WRAPPER_URL)).toBeTruthy();
    // }

    expect().toContainNode(processedXml, './/AdParameters');

    expect().toContainNode(processedXml, './/VideoClicks');
    expect().toContainSupersetOfNodes(processedXml, originalXml, './/VideoClicks/*');

    if (!exclude.includes('extension')) {
      expect().toContainNode(processedXml, './/Extensions');
      expect().toContainSupersetOfNodes(processedXml, originalXml, './/Extensions');
    }
  };

  it('VAST 2.0 Inline tag with video', async () => {
    await testXmlSections(testXmlUrlMap.get('vast-3.0-inline-video.xml'), {});
  });

  it('VAST 2.0 Inline tag with video', async () => {
    await testXmlSections(testXmlUrlMap.get('vast-2.0-inline-video.xml'), { exclude: 'errorOriginal extension' });
  });

  it('VAST 4.1 Inline tag with video', async () => {
    // @TODO discover why libxml can't parse this document
    await testXmlSections(testXmlUrlMap.get('vast-4.1-inline-video.xml'), { exclude: 'extension errorOriginal' });
  });

  it('VAST 4.0 Inline tag with vpaid and video', async () => {
    await testXmlSections(testXmlUrlMap.get('vast-4.0-inline-vpaid-video.xml'), {});
  });

  it('VAST 2.0 Wrapper tag following No ad', async () => {
    await testXmlSections(testXmlUrlMap.get('vast-2.0-wrapper-wrapper-no-ad.xml'),
      { exclude: 'errorOriginal mediaFile' });
  });

  it('VAST 3.0 Wrapper to Inline with video', async () => {
    await testXmlSections(testXmlUrlMap.get('vast-3.0-wrapper-inline-video.xml'), { exclude: 'extension mediaFile' });
  });

  it('VAST 4.0 Wrapper to Inline with VPAID', async () => {
    await testXmlSections(testXmlUrlMap.get('vast-4.0-wrapper-inline-vpaid.xml'), {});
  });

  it('VAST 3.0 Ad Pod with 2 Inline video ads', async () => {
    await testXmlSections(testXmlUrlMap.get('vast-3.0-adpod-inline-video.xml'), { exclude: 'errorOriginal' });
  });
});
