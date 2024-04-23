'use strict';

// validates that clientId is present and not empty
// @TODO: improve this logic later (we need to actually check that the clientId is valid
const isValidClientId = clientId => !!clientId;

module.exports = isValidClientId;
