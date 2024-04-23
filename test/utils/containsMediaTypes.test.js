'use strict';

const fs = require('fs');
const path = require('path');

const expect = require('expect');
const libxmljs = require('libxmljs');

const containsMediaTypes = require('../../src/utils/containsMediaTypes');

const vast = fs.readFileSync(path.join(__dirname, '../fixtures/', 'just_test_vast3.0.xml'), 'utf8');

describe('containsMediaTypes', () => {
  const xmlDoc = libxmljs.parseXml(vast);
  const mediaFiles = xmlDoc.find('.//MediaFile');

  it('should return true - mediaFiles array contains both quicktime and mp4 type', () => {
    const mediaTypes = ['quicktime', 'mp4'];

    expect(containsMediaTypes({ mediaFiles, mediaTypes })).toBe(true);
  });

  it('should return false - mediaFiles array does not contain both javascript, but contains mp4 types', () => {
    const mediaTypes = ['javascript', 'mp4'];

    expect(containsMediaTypes({ mediaFiles, mediaTypes })).toBe(false);
  });
});
