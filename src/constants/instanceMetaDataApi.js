'use strict';

const instanceMetaDataApi = {
  localHostname: 'http://169.254.169.254/latest/meta-data/local-hostname',
  reservationId: 'http://169.254.169.254/latest/meta-data/reservation-id',
};
Object.freeze(instanceMetaDataApi);

module.exports = instanceMetaDataApi;
