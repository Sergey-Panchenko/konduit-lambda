'use strict';

const expect = require('expect');
const https = require('https');
const URL = require('url');
const supertest = require('supertest');
const nock = require('nock');
const app = require('../../src/app');

const getHostname = url => URL.parse(url).hostname;

const downloadFile = url => new Promise((resolve, reject) => {
  https.get(url, (res) => {
    const { statusCode } = res;

    if (statusCode !== 200) {
      // Consume response data to free up memory
      res.resume();
      reject(new Error(`Request Failed. Status Code: ${statusCode}`));
      return;
    }

    res.setEncoding('utf8');
    let rawData = '';
    res.on('data', (chunk) => {
      rawData += chunk;
    });
    res.on('end', () => resolve(rawData));
  }).on('error', e => reject(e));
});

const enableNockConnect = (xmlUrls) => {
  const superTestHostname = supertest(app).get('').url;
  const hosts = [superTestHostname, ...xmlUrls].map(getHostname);
  const uniqueHosts = Array.from(new Set(hosts));

  nock.enableNetConnect((url) => {
    return uniqueHosts.includes(url.split(':')[0]);
  });
};

expect.extend({
  toContainNode(xmlDoc, sectionName) {
    const node = xmlDoc.get(sectionName);
    const pass = !!node;
    return {
      message: () => `Expect ${sectionName} to be present in XML`,
      pass,
    };
  },

  toContainNodesCount(xmlDoc, sectionName, count) {
    const foundCount = xmlDoc.find(sectionName).length;
    const pass = foundCount === count;
    return {
      message: () => `Expect count of ${sectionName} nodes to be ${count}`,
      pass,
    };
  },

  toContainSupersetOfNodes(supersetXmlDoc, subsetXmlDoc, sectionName) {
    const foundSuperset = supersetXmlDoc.find(sectionName);
    const foundSubset = subsetXmlDoc.find(sectionName);
    const pass = foundSubset.every(subNode => foundSuperset.find(superNode => subNode.text().trim() === superNode.text().trim()));
    return {
      message: () => `Expect ${sectionName} from subset XML to be a subset of superset XML`,
      pass,
    };
  },

  toContainNewNodesStartingWith(supersetXmlDoc, subsetXmlDoc, sectionName, substring) {
    const foundSuperset = supersetXmlDoc.find(sectionName);
    const foundSubset = subsetXmlDoc.find(sectionName);
    const addedNodes = foundSuperset.filter(subNode => !foundSubset.find(superNode => subNode.text().trim() === superNode.text().trim()));
    const pass = addedNodes.every(node => node.text().trim().startsWith(substring));
    return {
      message: () => `Expect all new XML nodes of ${sectionName} to start with "${substring}"`,
      pass,
    };
  },
});

module.exports = {
  downloadFile,
  enableNockConnect,
  getHostname,
};
