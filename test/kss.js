/*global suite, test, setup, teardown*/
var kss = require('../index.js'),
  path = require('path'),
  fs = require('fs'),
  marked = require('marked'),
  util = require('util'),
  KssStyleguide = kss.KssStyleguide,
  KssSection = kss.KssSection,
  KssModifier = kss.KssModifier,
  KssParameter = kss.KssParameter,
  styleDirectory = path.normalize(__dirname + '/fixtures-styles/'),
  assert = require('assert'),
  common = require('./common.js')(styleDirectory);

suite('Public Method/Class Check', function() {
  common.hasMethod(kss, 'parse');
  common.hasMethod(kss, 'traverse');
  common.hasMethod(kss, 'KssSection');
  common.hasMethod(kss, 'KssModifier');
  common.hasMethod(kss, 'KssParameter');
  common.hasMethod(kss, 'KssStyleguide');
});
