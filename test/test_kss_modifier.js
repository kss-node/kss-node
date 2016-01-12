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
    'markup',
    'toJSON'
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
      expect(obj).to.have.property('meta');
      expect(obj.meta).to.have.property('section');
      expect(obj).to.have.property('data');
      expect(obj.data).to.have.property('name');
      expect(obj.data).to.have.property('description');
      expect(obj.data).to.have.property('className');
      done();
    });

    it('should return a KssModifier object when called normally', function(done) {
      /* eslint-disable new-cap */
      var obj = kss.KssModifier({name: '.modifier'});
      expect(obj).to.be.an.instanceof(kss.KssModifier);
      expect(obj.name()).to.equal('.modifier');
      done();
      /* eslint-enable new-cap */
    });
  });

  describe('.section()', function() {
    it('should return meta.section', function(done) {
      this.styleguide.data.sections.map(function(section) {
        section.modifiers().map(function(modifier) {
          expect(modifier.section()).to.equal(modifier.meta.section).and.equal(section);
        });
      });
      done();
    });

    it('should set meta.section if given a value', function(done) {
      var section = new kss.KssSection({header: 'Section'}),
        modifier = new kss.KssModifier({name: 'original'});
      modifier.section(section);
      expect(modifier.meta.section).to.deep.equal(section);
      expect(modifier.section()).to.deep.equal(modifier.meta.section);
      done();
    });

    it('should return itself if given a value', function(done) {
      var section = new kss.KssSection({header: 'Section'}),
        modifier = new kss.KssModifier({name: 'original'});
      expect(modifier.section(section)).to.deep.equal(modifier);
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

    it('should set data.name if given a value', function(done) {
      var modifier = new kss.KssModifier({name: 'original'});
      modifier.name('new');
      expect(modifier.data.name).to.equal('new');
      expect(modifier.name()).to.equal(modifier.data.name);
      done();
    });

    it('should return itself if given a value', function(done) {
      var modifier = new kss.KssModifier({name: 'original'});
      expect(modifier.name('new')).to.deep.equal(modifier);
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

    it('should set data.description if given a value', function(done) {
      var modifier = new kss.KssModifier({description: 'original'});
      modifier.description('new');
      expect(modifier.data.description).to.equal('new');
      expect(modifier.description()).to.equal(modifier.data.description);
      done();
    });

    it('should return itself if given a value', function(done) {
      var modifier = new kss.KssModifier({description: 'original'});
      expect(modifier.description('new')).to.deep.equal(modifier);
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

    it('should convert pseudo-class to kss.js-style .pseudo-class-[name]', function(done) {
      this.styleguide.data.sections.map(function(section) {
        section.modifiers().map(function(modifier) {
          expect(modifier.className()).to.equal(modifier.data.name.replace(/\:/g, '.pseudo-class-').split(/\s/)[0].replace(/\./g, ' ').replace(/^\s*/g, ''));
        });
      });
      done();
    });

    it('should return false if it does not have a class name', function(done) {
      var modifier = new kss.KssModifier();
      expect(modifier.className()).to.be.false;
      done();
    });

    it('should set data.className if given a value', function(done) {
      var modifier = new kss.KssModifier({name: '.original'});
      modifier.className('new');
      expect(modifier.data.className).to.equal('new');
      expect(modifier.className()).to.equal(modifier.data.className);
      done();
    });

    it('should return itself if given a value', function(done) {
      var modifier = new kss.KssModifier({name: '.original'});
      expect(modifier.className('new')).to.deep.equal(modifier);
      done();
    });
  });

  describe('.markup()', function() {
    it('should return an unfiltered meta.section.markup', function(done) {
      this.styleguide.data.sections.map(function(section) {
        section.modifiers().map(function(modifier) {
          if (section.data.markup) {
            expect(modifier.meta.section.data.markup).to.equal(section.data.markup);
            expect(modifier.markup()).to.equal(section.data.markup);
          }
        });
      });
      done();
    });

    it('should return empty string if it does not have any associated markup', function(done) {
      var modifier = new kss.KssModifier();
      modifier.section(new kss.KssSection());
      expect(modifier.markup()).to.be.string('');
      done();
    });

    it('should return empty string if it does not have an associated kssSection', function(done) {
      var modifier = new kss.KssModifier();
      expect(modifier.markup()).to.be.string('');
      done();
    });
  });

  describe('.toJSON()', function() {
    it('should return valid JSON object', function(done) {
      this.styleguide.data.sections.map(function(section) {
        section.modifiers().map(function(modifier) {
          var str;
          expect(modifier.toJSON()).to.be.an.instanceOf(Object);
          // Verify it converts to a JSON string.
          str = JSON.stringify(modifier.toJSON());
          expect(str).to.be.string;
          // Compare JSON string to original.
          expect(JSON.parse(str)).to.deep.equal(modifier.toJSON());
        });
      });
      done();
    });

    it('should return data as a JSON object', function(done) {
      this.styleguide.data.sections.map(function(section) {
        section.modifiers().map(function(modifier) {
          var json = modifier.toJSON();
          expect(json.name).to.equal(modifier.data.name);
          expect(json.description).to.equal(modifier.data.description);
          expect(json.className).to.equal(modifier.className());
        });
      });
      done();
    });
  });
});
