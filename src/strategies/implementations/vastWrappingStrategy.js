'use strict';

const fs = require('fs');
const libxmljs = require('libxmljs');

const Strategy = require('../Strategy');
const HandlerReport = require('../HandlerReport');

const isValidUrl = require('../../utils/isValidUrl');

const vastWrapperXml = fs.readFileSync('./vast-templates/vastWrapper.xml');

const { CLIENT_WO_ID } = require('../../constants/clientIds');

const vastWrapperIncludeClients = new Set([CLIENT_WO_ID]);
const clientAdSystemName = new Map([
  [CLIENT_WO_ID, 'WO'],
]);

const handler = (context) => {
  const vastWrapperDoc = libxmljs.parseXml(vastWrapperXml);

  if (context.initialVastUrl && isValidUrl(context.initialVastUrl)) {
    vastWrapperDoc.get('.//VASTAdTagURI')
      .cdata(context.initialVastUrl);
  }

  vastWrapperDoc.get('.//AdSystem')
    .cdata(clientAdSystemName.get(context.clientId));

  context.xmlDoc = vastWrapperDoc;

  return HandlerReport.makeSuccessful({ wrapped: true });
};

const vastWrappingStrategy = new Strategy({
  isActual: context => vastWrapperIncludeClients.has(context.clientId),
  handler,
});

module.exports = vastWrappingStrategy;
