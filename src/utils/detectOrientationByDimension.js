'use strict';

const orientations = {
  PORTRAIT: 'portrait',
  LANDSCAPE: 'landscape',
  SQUARE: 'square',
};

const detectOrientationByDimension = ({ width, height } = {}) => {
  let orientation = 'none';

  if (width > 0 && height > 0) {
    if (width > height) {
      orientation = orientations.LANDSCAPE;
    } else if (width < height) {
      orientation = orientations.PORTRAIT;
    } else if (width === height) {
      orientation = orientations.SQUARE;
    }
  }

  return orientation;
};

module.exports = detectOrientationByDimension;
