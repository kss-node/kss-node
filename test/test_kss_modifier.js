/*global describe,it,before*/
/*eslint-disable max-nested-callbacks*/

'use strict';

var kss = require('../index.js'),
  testUtils = require('./testUtils');


describe('KssModifier object API', function() {
  before(function(done) {
    var self = this;
    testUtils.traverseFixtures({mask: '*.less|*.css'}, function(styleguide) {
      self.styleguide = styleguide;
      done();
    });
  });

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
      this.styleguide.data.sections.map(function(section) {
        section.modifiers().map(function(modifier) {
          modifier.name().should.be.equal(modifier.data.name);
        });
      });
      done();
    });
  });

  describe('.description()', function() {
    it('should return data.description', function(done) {
      this.styleguide.data.sections.map(function(section) {
        section.modifiers().map(function(modifier) {
          modifier.description().should.be.equal(modifier.data.description);
        });
      });
      done();
    });
  });

  describe('.className()', function() {
    it('should be valid CSS classes', function(done) {
      this.styleguide.data.sections.map(function(section) {
        section.modifiers().map(function(modifier) {
          modifier.className().should.match(/[a-z \-_]/gi);
        });
      });
      done();
    });
  });

  describe('.markup()', function() {
    it('should return an unfiltered data.section.markup', function(done) {
      this.styleguide.data.sections.map(function(section) {
        section.modifiers().map(function(modifier) {
          if (section.data.markup) {
            modifier.data.section.data.markup.should.be.equal(section.data.markup);
            modifier.markup().should.be.equal(section.data.markup);
          }
        });
      });
      done();
    });
  });
});
