'use strict';

var path = require('path'),
  kss = require('../index.js'),
  should = require('should');

module.exports = {

  // Returns the full path to the test fixtures in test/fixtures or sub-directory.
  fixtures: function(subdirectory) {
    if (!subdirectory) {
      subdirectory = '';
    }
    return path.join(__dirname, 'fixtures', subdirectory);
  },

  // Simplifies usage of kss.traverse() in various tests.
  traverseFixtures: function(options, cb) {
    kss.traverse(this.fixtures(), options, function(err, styleguide) {
      should.not.exist(err);
      styleguide.data.sections.should.be.ok();
      cb(styleguide);
    });
  }
};
