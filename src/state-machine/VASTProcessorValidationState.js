'use strict';

const fs = require('fs');
const util = require('util');
const libxmljs = require('libxmljs');

const AbstractState = require('./AbstractState');
const VASTProcessorTransformState = require('./VASTProcessorTransformState');

const getConfigParameter = require('../utils/getConfigParameter');
const { mapUrlToVendorName } = require('../utils/mapUrlToVendorName');
const metrics = require('../utils/metrics');
const isInitialVastContext = require('../utils/isInitialVastContext');

const AD_TYPES = require('../constants/adTypes');
const { CLIENT_WO_ID } = require('../constants/clientIds');

const clientsWithGenericSchemaSupport = new Set([CLIENT_WO_ID]);

const vastSupportedSchema = getConfigParameter('VAST_SCHEMA');
const vastSupportedSchemaDoc = libxmljs.parseXml(fs.readFileSync(vastSupportedSchema));

const vastGenericSchema = './schema/vast/supported/vast_generic_20190426.xsd';
const vastGenericSchemaDoc = libxmljs.parseXml(fs.readFileSync(vastGenericSchema));

class VASTProcessorValidationState extends AbstractState {
  constructor(stateName = VASTProcessorValidationState.STATE_NAME) {
    super(stateName);
    this.vastVendor = null;
    this.vastType = null;
  }

  static chooseValidationSchema(clientId) {
    const validationSchema = {};

    if (clientsWithGenericSchemaSupport.has(clientId)) {
      validationSchema.path = vastGenericSchema;
      validationSchema.doc = vastGenericSchemaDoc;
    } else {
      validationSchema.path = vastSupportedSchema;
      validationSchema.doc = vastSupportedSchemaDoc;
    }

    return validationSchema;
  }

  run(context) {
    super.run(context);

    this.validationSchema = VASTProcessorValidationState.chooseValidationSchema(context.clientId);

    this.vastVendor = mapUrlToVendorName(context.currentVastUrl);

    const isValidXmlDoc = context.xmlDoc.validate(this.validationSchema.doc);

    if (isValidXmlDoc) {
      this.validationSuccess();
    } else {
      this.validationError();
    }
  }

  validationSuccess() {
    const context = this.getContext();

    this._logInfo('VAST xml is supported', {
      state: 'ValidVast',
      vastVendor: this.vastVendor,
      vastSchema: this.validationSchema.path,
    });

    context.setState(new VASTProcessorTransformState());
  }

  validationError() {
    const context = this.getContext();

    this.vastType = 'unsupported';
    this._logError('VAST xml is not supported', this.prepareLogData());

    metrics.vastRequest(context, { status: 'passed_as_is', type: this.vastType });

    if (context.isOttRequest) {
      this.proceedOttRequest();
    } else {
      context.forwardFirstVASTResponse();
    }
  }

  noAd() {
    const context = this.getContext();

    context.isNoAd = true;

    this._logWarning('No Ad VAST', this.prepareLogData());

    if (isInitialVastContext(context)) {
      context.initialAdType = AD_TYPES.NO_AD;
    }
  }

  proceedOttRequest() {
    const context = this.getContext();
    context.optimizationChain.push('none');

    if (this.vastType === 'no_ad') {
      this.ottNoAd();
    } else {
      this.ottUnsupported();
    }
  }

  ottNoAd() {
    metrics.vastCreativeOtt(context, { action: 'pass-ok', type: this.vastType });
    this.getContext().forwardFirstVASTResponse();
  }

  ottUnsupported() {
    const context = this.getContext();

    context.optimizationChain.push('_ott_empty');
    metrics.vastCreativeOtt(context, { action: 'cleanup', type: this.vastType });
    context.sendEmptyVastResponse();
  }

  prepareLogData() {
    const context = this.getContext();

    return {
      state: this.vastType === 'no_ad' ? 'NoAdVast' : 'InvalidVast',
      error: util.inspect(context.xmlDoc.validationErrors, false, null),
      vastType: this.vastType,
      vastUrl: context.currentVastUrl,
      vastVendor: this.vastVendor,
      vastSchema: this.validationSchema.path,
    };
  }
}

VASTProcessorValidationState.STATE_NAME = '4:Validation';

module.exports = VASTProcessorValidationState;
