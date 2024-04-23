'use strict';

const serializeParameter = (name, value, encode, excludeEncoding) => {
  let resultingValue = value;
  if (encode && excludeEncoding.indexOf(name) < 0) {
    resultingValue = encodeURIComponent(value);
  }
  return (value === null || value === undefined) ?
    name : `${name}=${resultingValue}`;
};

class PixelUrl {
  constructor({
    host = '',
    path = '/',
    encode = false,
    excludeEncoding = [],
    parameters = {},
    // @TODO: quick solution
    //        ensure some parameters would be added to the end of url
    optionalParametersStr = '',
  }) {
    const pixelQueryString = Object.keys(parameters)
      .map(key => serializeParameter(key, parameters[key], encode, excludeEncoding))
      .join('&');

    this.urlString = `${host}${path}?${pixelQueryString}${optionalParametersStr}`;
  }

  toString() {
    return this.urlString;
  }
}

module.exports = PixelUrl;
