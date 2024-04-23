'use strict';

const libxmljs = require('libxmljs');

const AbstractState = require('./AbstractState');
const VASTProcessorValidationState = require('./VASTProcessorValidationState');

const metrics = require('../utils/metrics');
const xmlRenameElements = require('../utils/xmlRenameElements');
const xmlDeleteElements = require('../utils/xmlDeleteElements');

class VASTProcessorParsingState extends AbstractState {
  constructor(stateName = VASTProcessorParsingState.STATE_NAME) {
    super(stateName);
  }

  run(context) {
    super.run(context);

    // NOTE: hotfix, avoid xmlns in a XML document
    const noNamespaceTextResult = context.currentTextResult
      .replace(/ xmlns="(.*?)"/g, '');

    return Promise.resolve(noNamespaceTextResult)
      .then(libxmljs.parseXmlAsync)
      // @NOTE: rename all Wrapper//ClickThrough as ClickTracking to support current validation schema
      .then(xmlDoc => xmlRenameElements(xmlDoc, './/Wrapper//ClickThrough', 'ClickTracking'))
      // @NOTE: delete MediaFiles node from wrapper tags
      .then(xmlDoc => xmlDeleteElements(xmlDoc, './/Wrapper//MediaFiles'))
      .then((xmlDoc) => {
        this._logInfo('VAST successfully parsed', {
          state: 'ParseSuccess',
        });

        context.xmlDoc = xmlDoc;
        context.setState(new VASTProcessorValidationState());
      })
      .catch((error) => {
        this._logError('VAST XML parse error', {
          state: 'ParseError',
          error,
        });

        // @todo: remove `type:unsopported` tag
        //        tag is here to not break Passed as is breakdoen chart
        metrics.vastRequest(context, { status: 'passed_as_is', type: 'unsupported' });
        metrics.vastRedirectRequest(context, { type: 'unsupported' });
        context.redirectToInitialVastUrl();
      });
  }
}

VASTProcessorParsingState.STATE_NAME = '3:Parsing';

module.exports = VASTProcessorParsingState;
