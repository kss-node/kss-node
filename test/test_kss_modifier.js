/*global describe,it*/
/*eslint-disable max-nested-callbacks*/

'use strict';

var kss = require('../index.js'),
  testUtils = require('./testUtils');

var options = {mask: '*.less|*.css'};

describe('KssModifier object API', function() {
  /*eslint-disable guard-for-in,no-loop-func*/
  [
    'name',
    'description',
    'className',
    'markup'
  ].forEach(function(method) {
    it('has ' + method + '() method', function() {
      (new kss.KssModifier({})).should.have.method(method);
    });
  });
  /*eslint-enable guard-for-in,no-loop-func*/

  describe('.name()', function() {
    it('should return data.name', function(done) {
      testUtils.eachSection(done, options, function(section) {
        section.modifiers().map(function(modifier) {
          modifier.name().should.be.equal(modifier.data.name);
        });
      });
    });
  });

  describe('.description()', function() {
    it('should return data.description', function(done) {
      testUtils.eachSection(done, options, function(section) {
        section.modifiers().map(function(modifier) {
          modifier.description().should.be.equal(modifier.data.description);
        });
      });
    });
  });

  describe('.className()', function() {
    it('should be valid CSS classes', function(done) {
      testUtils.eachSection(done, options, function(section) {
        section.modifiers().map(function(modifier) {
          modifier.className().should.match(/[a-z \-_]/gi);
        });
      });
    });
  });

  describe('.markup()', function() {
    it('should return an unfiltered data.section.markup', function(done) {
      testUtils.eachSection(done, options, function(section) {
        section.modifiers().map(function(modifier) {
          if (section.data.markup) {
            modifier.data.section.data.markup.should.be.equal(section.data.markup);
            modifier.markup().should.be.equal(section.data.markup);
          }
        });
      });
    });
  });

});
