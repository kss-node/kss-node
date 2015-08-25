'use strict';

// Globals for all test_*.js files. Add these to .eslintrc too.
global.chai = require('chai');
global.kss = require('../index.js');
global.path = require('path');
global.should = global.chai.should();

// Create a helper utility object.
global.helperUtils = {
  // Returns the full path to the test fixtures in test/fixtures or sub-directory.
  fixtures: function() {
    // Add the fixtures path to the start our list of paths.
    var args = Array.prototype.slice.call(arguments);
    args.unshift('fixtures');
    args.unshift(__dirname);
    return path.join.apply(this, args);
  },

  // Simplifies usage of kss.traverse() in various tests.
  traverseFixtures: function(options, cb) {
    kss.traverse(this.fixtures(), options, function(err, styleguide) {
      should.not.exist(err);
      styleguide.data.sections.should.be.ok;
      cb(styleguide);
    });
  }
};

// This before() is run before any tests in the test_*.js files.
before(function() {
  // Add custom assertions.
  chai.use(function(chai) {
    var Assertion = chai.Assertion;

    // .should.containFixture(string) asserts that a given file should be in an array.
    Assertion.addMethod('containFixture', function(file) {
      file = path.resolve(helperUtils.fixtures(), file);
      this.assert(
        this._obj.data.files.indexOf(file) >= 0,
        'to contain the file named #{exp}, but contained #{act}',
        'to not contain the file named #{exp} in #{act}',
        file,
        this._obj.data.files
      );
    });
  });
});
