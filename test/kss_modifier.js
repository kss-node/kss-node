/*global suite*/

var kss = require('../index.js'),
  assert = require('assert'),
  common = require('./common.js'),
  path = require('path');

var KssModifier = kss.KssModifier,
  styleDirectory = path.join(__dirname, '/fixtures-styles/');

common = common(styleDirectory);

suite('KssModifier', function() {
  'use strict';

  common.hasMethod(new KssModifier({}), 'name');
  common.hasMethod(new KssModifier({}), 'description');
  common.hasMethod(new KssModifier({}), 'className');
  common.hasMethod(new KssModifier({}), 'markup');

  suite('.name()', function() {
    common.testAllSections('should return data.name', '*.less|*.css', function(section) {
      var modifiers = section.modifiers(),
        i, l = modifiers.length;

      for (i = 0; i < l; i += 1) {
        assert.equal(modifiers[i].data.name, modifiers[i].name());
      }
    });
  });
  suite('.description()', function() {
    common.testAllSections('should return data.description', '*.less|*.css', function(section) {
      var modifiers = section.modifiers(),
        i, l = modifiers.length;

      for (i = 0; i < l; i += 1) {
        assert.equal(modifiers[i].data.description, modifiers[i].description());
      }
    });
  });
  suite('.className()', function() {
    common.testAllSections('should be valid CSS classes', '*.less|*.css', function(section) {
      var modifiers = section.modifiers(),
        i, l = modifiers.length;

      for (i = 0; i < l; i += 1) {
        assert.ok(modifiers[i].className().match(/[a-z \-_]/gi));
      }
    });
  });

  suite('.markup()', function() {
    common.testAllSections('should return an unfiltered data.section.markup', '*.less|*.css', function(section) {
      var modifiers = section.modifiers(),
        i, l = modifiers.length;

      for (i = 0; i < l; i += 1) {
        if (!modifiers[i].markup()) {
          continue;
        }

        assert.equal(section.data.markup, modifiers[i].data.section.data.markup);
        assert.equal(section.data.markup, modifiers[i].markup());
      }
    });
  });
});
