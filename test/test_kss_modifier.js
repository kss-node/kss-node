/* eslint-disable max-nested-callbacks */

'use strict';

describe('KssModifier object API', function() {
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
    'description',
    'className',
    'markup'
  ].forEach(function(method) {
    it('has ' + method + '() method', function(done) {
      (new kss.KssModifier({})).should.respondTo(method);
      done();
    });
  });
  /* eslint-enable guard-for-in,no-loop-func */

  describe('KssModifier constructor', function() {
    it('should initialize the data', function(done) {
      var obj = new kss.KssModifier();
      obj.should.have.property('data');
      obj.data.should.have.property('section');
      obj.data.should.have.property('name');
      obj.data.should.have.property('description');
      obj.data.should.have.property('className');
      done();
    });

    it('should return a KssModifier object when called normally', function(done) {
      /* eslint-disable new-cap */
      var obj = kss.KssModifier();
      obj.should.be.an.instanceof(kss.KssModifier);
      done();
      /* eslint-enable new-cap */
    });
  });

  describe('.section()', function() {
    it('should return this.section', function(done) {
      this.styleguide.data.sections.map(function(section) {
        section.modifiers().map(function(modifier) {
          modifier.section().should.be.equal(modifier.data.section).and.equal(section);
        });
      });
      done();
    });
  });

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

    it('should return false if it does not have a class name', function(done) {
      var modifier = new kss.KssModifier();
      modifier.className().should.be.false;
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

    it('should return empty string if it does not have any associated markup', function(done) {
      var modifier = new kss.KssModifier();
      modifier.data.section = new kss.KssSection();
      modifier.markup().should.be.string('');
      done();
    });

    it('should return empty string if it does not have an associated kssSection', function(done) {
      var modifier = new kss.KssModifier();
      modifier.markup().should.be.string('');
      done();
    });
  });
});
