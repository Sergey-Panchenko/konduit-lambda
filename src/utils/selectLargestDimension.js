'use strict';

const _ = require('lodash');
const detectOrientationByDimension = require('./detectOrientationByDimension');

const groupDimensionByOrientations = (dimensions) => {
  return _.groupBy(dimensions, (dimension => detectOrientationByDimension(dimension)));
};

const DIMENSION_ITEM_INDEX = 1;

const selectLargestDimension = (mediaFiles = [], defaultDemension) => {
  const dimensions = mediaFiles.map(mediaFile => ({ width: +mediaFile.width, height: +mediaFile.height }));
  const orientationGroups = groupDimensionByOrientations(dimensions);
  let resultingDimension;

  delete orientationGroups.none;

  const maxDimensionGroup = _.maxBy(
    _.toPairs(orientationGroups),
    orientationGroup => orientationGroup[DIMENSION_ITEM_INDEX].length
  );

  if (maxDimensionGroup) {
    const maxDimension = _.maxBy(maxDimensionGroup[1], ({ width, height }) => width + height);

    if (maxDimension) {
      resultingDimension = maxDimension;
    }
  }

  return resultingDimension || defaultDemension || {};
};

module.exports = selectLargestDimension;
