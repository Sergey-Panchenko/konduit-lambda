'use strict';

const libxml = require('libxmljs');
const expect = require('expect');
const filterAdUnits = require('../../src/utils/filterAdUnits');

const vastTagFixture = `<?xml version="1.0" encoding="UTF-8"?>
<VAST vsersion="3.0">
  <Ad />
  <Ad stays="1" />
  <Ad />
  <Ad />
  <Ad stays="1" />
  <Ad stays="1" />
  <Ad />
  <Ad />
  <Ad />
</VAST>
`;

describe('filterAdUnits util', () => {
  it('should filter passed document adUnits with filtering function', () => {
    const xmlDoc = libxml.parseXml(vastTagFixture);

    const filterFunction = (adUnit) => {
      const checker = adUnit.getAttribute('stays');
      return checker !== null;
    };

    const result = filterAdUnits(xmlDoc, filterFunction);

    const resultAds = result.find('.//Ad');
    expect(resultAds).toBeAn(Array);
    expect(resultAds.length).toEqual(3);
    // TODO: Need to check the 'stays' attributes
    // expect(resultAds.every(adUnit => !!adUnit.getAttribute('stays'))).toEqual(true);
  });
});
