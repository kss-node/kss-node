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
      expect(new kss.KssModifier({})).to.respondTo(method);
      done();
    });
  });
  /* eslint-enable guard-for-in,no-loop-func */

  describe('KssModifier constructor', function() {
    it('should initialize the data', function(done) {
      var obj = new kss.KssModifier();
      expect(obj).to.have.property('data');
      expect(obj.data).to.have.property('section');
      expect(obj.data).to.have.property('name');
      expect(obj.data).to.have.property('description');
      expect(obj.data).to.have.property('className');
      done();
    });

    it('should return a KssModifier object when called normally', function(done) {
      /* eslint-disable new-cap */
      var obj = kss.KssModifier();
      expect(obj).to.be.an.instanceof(kss.KssModifier);
      done();
      /* eslint-enable new-cap */
    });
  });

  describe('.section()', function() {
    it('should return this.section', function(done) {
      this.styleguide.data.sections.map(function(section) {
        section.modifiers().map(function(modifier) {
          expect(modifier.section()).to.equal(modifier.data.section).and.equal(section);
        });
      });
      done();
    });
  });

  describe('.name()', function() {
    it('should return data.name', function(done) {
      this.styleguide.data.sections.map(function(section) {
        section.modifiers().map(function(modifier) {
          expect(modifier.name()).to.equal(modifier.data.name);
        });
      });
      done();
    });
  });

  describe('.description()', function() {
    it('should return data.description', function(done) {
      this.styleguide.data.sections.map(function(section) {
        section.modifiers().map(function(modifier) {
          expect(modifier.description()).to.equal(modifier.data.description);
        });
      });
      done();
    });
  });

  describe('.className()', function() {
    it('should be valid CSS classes', function(done) {
      this.styleguide.data.sections.map(function(section) {
        section.modifiers().map(function(modifier) {
          expect(modifier.className()).to.match(/[a-z \-_]/gi);
        });
      });
      done();
    });

    it('should return false if it does not have a class name', function(done) {
      var modifier = new kss.KssModifier();
      expect(modifier.className()).to.be.false;
      done();
    });
  });

  describe('.markup()', function() {
    it('should return an unfiltered data.section.markup', function(done) {
      this.styleguide.data.sections.map(function(section) {
        section.modifiers().map(function(modifier) {
          if (section.data.markup) {
            expect(modifier.data.section.data.markup).to.equal(section.data.markup);
            expect(modifier.markup()).to.equal(section.data.markup);
          }
        });
      });
      done();
    });

    it('should return empty string if it does not have any associated markup', function(done) {
      var modifier = new kss.KssModifier();
      modifier.data.section = new kss.KssSection();
      expect(modifier.markup()).to.be.string('');
      done();
    });

    it('should return empty string if it does not have an associated kssSection', function(done) {
      var modifier = new kss.KssModifier();
      expect(modifier.markup()).to.be.string('');
      done();
    });
  });
});
