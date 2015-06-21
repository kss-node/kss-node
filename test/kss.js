/*global suite*/
var kss = require('../index.js'),
  common = require('./common.js'),
  path = require('path');

var styleDirectory = path.join(__dirname, '/fixtures-styles/');

common = common(styleDirectory);

suite('Public Method/Class Check', function() {
  'use strict';

  common.hasMethod(kss, 'parse');
  common.hasMethod(kss, 'traverse');
  common.hasMethod(kss, 'KssSection');
  common.hasMethod(kss, 'KssModifier');
  common.hasMethod(kss, 'KssParameter');
  common.hasMethod(kss, 'KssStyleguide');
});
