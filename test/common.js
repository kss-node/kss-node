/*global before*/

'use strict';

// Run this setup before any tests.
before(function() {
  var should = require('should'),
    path = require('path'),
    testUtils = require('./testUtils');

  // Add custom assertions.

  // .should.have.method(string) asserts that a method exists.
  should.Assertion.add('method', function(method) {
    this.params = {operator: 'to have the ' + method + '() method'};
    this.obj.should.have.property(method).which.is.a.Function();
  });

  // .should.containFile(string) asserts that a given file should be in an array.
  should.Assertion.add('containFile', function(file) {
    this.params = {operator: 'to contain the file'};
    file = path.resolve(testUtils.fixtures(), file);
    this.obj.data.files.should.containEql(file);
  });
});
