/* eslint-disable max-nested-callbacks */

'use strict';

describe('KssParameter object API', function() {
  before(function(done) {
    var self = this;
    helperUtils.traverseFixtures({mask: '*.less|*.css'}, function(styleguide) {
      self.styleguide = styleguide;
      done();
    });
  });

  /* eslint-disable guard-for-in,no-loop-func */
  ['section',
    'name',
    'description'
  ].forEach(function(method) {
    it('has ' + method + '() method', function(done) {
      (new kss.KssParameter({})).should.respondTo(method);
      done();
    });
  });
  /* eslint-enable guard-for-in,no-loop-func */

  describe('KssParameter constructor', function() {
    it('should initialize the data', function(done) {
      var obj = new kss.KssParameter();
      obj.should.have.property('data');
      obj.data.should.have.property('section');
      obj.data.should.have.property('name');
      obj.data.should.have.property('description');
      done();
    });

    it('should return a KssParameter object when called normally', function(done) {
      /* eslint-disable new-cap */
      var obj = kss.KssParameter();
      obj.should.be.an.instanceof(kss.KssParameter);
      done();
      /* eslint-enable new-cap */
    });
  });

  describe('.section()', function() {
    it('should return this.section', function(done) {
      this.styleguide.data.sections.map(function(section) {
        section.parameters().map(function(parameter) {
          parameter.section().should.be.equal(parameter.data.section).and.equal(section);
        });
      });
      done();
    });
  });

  describe('.name()', function() {
    it('should return data.name', function(done) {
      this.styleguide.data.sections.map(function(section) {
        section.parameters().map(function(parameter) {
          parameter.name().should.be.equal(parameter.data.name);
        });
      });
      done();
    });
  });

  describe('.description()', function() {
    it('should return data.description', function(done) {
      this.styleguide.data.sections.map(function(section) {
        section.parameters().map(function(parameter) {
          parameter.description().should.be.equal(parameter.data.description);
        });
      });
      done();
    });
  });
});
