/* eslint-disable max-nested-callbacks */

'use strict';

var custom = ['custom', 'custom2', 'custom3'];

describe('KssSection object API', function() {
  before(function(done) {
    var self = this;
    helperUtils.traverseFixtures({mask: '*.less|*.css', custom: custom}, function(styleguide) {
      self.styleguide = styleguide;
      done();
    });
  });

  /* eslint-disable guard-for-in,no-loop-func */
  ['header',
    'description',
    'deprecated',
    'experimental',
    'reference',
    'depth',
    'encodeReferenceURI',
    'referenceURI',
    'modifiers',
    'firstModifier',
    'parameters',
    'toJSON'
  ].forEach(function(method) {
    it('has ' + method + '() method', function(done) {
      expect(new kss.KssSection()).to.respondTo(method);
      done();
    });
  });
  /* eslint-enable guard-for-in,no-loop-func */

  describe('KssSection constructor', function() {
    it('should initialize the data', function(done) {
      var obj = new kss.KssSection();
      expect(obj).to.have.property('meta');
      expect(obj.meta).to.have.property('styleguide');
      expect(obj.meta).to.have.property('raw');
      expect(obj.meta).to.have.property('customPropertyNames');
      expect(obj).to.have.property('data');
      expect(obj.data).to.have.property('header');
      expect(obj.data).to.have.property('description');
      expect(obj.data).to.have.property('deprecated');
      expect(obj.data).to.have.property('experimental');
      expect(obj.data).to.have.property('reference');
      expect(obj.data).to.have.property('depth');
      expect(obj.data).to.have.property('weight');
      expect(obj.data).to.have.property('referenceURI');
      expect(obj.data).to.have.property('markup');
      expect(obj.data).to.have.property('modifiers');
      expect(obj.data).to.have.property('parameters');
      done();
    });

    it('should return a KssSection object when called normally', function(done) {
      /* eslint-disable new-cap */
      var obj = kss.KssSection({header: 'Section'});
      expect(obj).to.be.an.instanceof(kss.KssSection);
      expect(obj.header()).to.equal('Section');
      done();
      /* eslint-enable new-cap */
    });
  });

  describe('.toJSON()', function() {
    it('should return valid JSON object', function(done) {
      this.styleguide.data.sections.map(function(section) {
        var str;
        expect(section.toJSON()).to.be.an.instanceOf(Object);
        // Verify it converts to a JSON string.
        str = JSON.stringify(section.toJSON());
        expect(str).to.be.string;
        // Compare JSON string to original.
        expect(JSON.parse(str)).to.eql(section.toJSON());
      });
      done();
    });

    it('should return custom properties', function(done) {
      this.styleguide.data.sections.map(function(section) {
        var json = section.toJSON();
        custom.map(function(name) {
          if (section.data[name]) {
            expect(json).to.have.property(name);
            expect(json[name]).to.equal(section.data[name]);
          }
        });
      });
      done();
    });
  });

  describe('.header()', function() {
    it('should return data.header', function(done) {
      this.styleguide.data.sections.map(function(section) {
        expect(section.header()).to.equal(section.data.header);
      });
      done();
    });
  });

  describe('.description()', function() {
    it('should return data.description', function(done) {
      this.styleguide.data.sections.map(function(section) {
        expect(section.description()).to.equal(section.data.description);
      });
      done();
    });
  });

  describe('.deprecated()', function() {
    it('should return data.deprecated', function(done) {
      this.styleguide.data.sections.map(function(section) {
        expect(section.deprecated()).to.equal(section.data.deprecated);
      });
      done();
    });
  });

  describe('.experimental()', function() {
    it('should return data.experimental', function(done) {
      this.styleguide.data.sections.map(function(section) {
        expect(section.experimental()).to.equal(section.data.experimental);
      });
      done();
    });
  });

  describe('.reference()', function() {
    it('should return data.reference', function(done) {
      this.styleguide.data.sections.map(function(section) {
        expect(section.reference()).to.equal(section.data.reference);
      });
      done();
    });
  });

  describe('.depth()', function() {
    it('should return data.depth', function(done) {
      this.styleguide.data.sections.map(function(section) {
        expect(section.depth()).to.equal(section.data.depth);
        expect(section.depth()).to.equal(section.reference().split(section.styleguide.referenceDelimiter).length);
        expect(section.depth()).to.be.at.least(0);
      });
      done();
    });
  });

  describe('.weight()', function() {
    it('should return data.weight', function(done) {
      this.styleguide.data.sections.map(function(section) {
        expect(section.weight()).to.equal(section.data.weight ? section.data.weight : 0);
        expect(section.weight()).to.be.at.least(-100000);
      });
      done();
    });
  });

  describe('.encodeReferenceURI()', function() {
    it('should return .referenceURI() when given reference()', function(done) {
      this.styleguide.data.sections.map(function(section) {
        expect(section.encodeReferenceURI(section.reference())).to.equal(section.referenceURI());
      });
      done();
    });
  });

  describe('.referenceURI()', function() {
    it('should return data.referenceURI', function(done) {
      this.styleguide.data.sections.map(function(section) {
        expect(section.referenceURI()).to.equal(section.data.referenceURI);
        expect(section.referenceURI()).to.equal(section.encodeReferenceURI(section.reference()));
      });
      done();
    });

    it('should replace all runs of non-word characters with a hyphen', function() {
      var section = new kss.KssSection();
      expect(section.encodeReferenceURI('test - section - with.multiple.runs..of--non-word.characters')).to.equal('test-section-with-multiple-runs-of--non-word-characters');
    });
  });

  describe('.modifiers()', function() {
    it('should return data.modifiers', function(done) {
      this.styleguide.data.sections.map(function(section) {
        expect(section.modifiers()).to.equal(section.data.modifiers);
      });
      done();
    });

    it('should return array of KssModifier', function(done) {
      this.styleguide.data.sections.map(function(section) {
        section.modifiers().map(function(modifier) {
          expect(modifier).to.be.instanceof(kss.KssModifier);
        });
      });
      done();
    });

    it('should return data.modifiers[n] given an integer as number or string', function(done) {
      this.styleguide.data.sections.map(function(section) {
        var i = 0;
        section.data.modifiers.map(function(modifier) {
          expect(section.modifiers(i)).to.be.eql(modifier);
          expect(section.modifiers(i.toString())).to.be.eql(modifier);
          i++;
        });
      });
      done();
    });

    it('should return false if number is not found', function(done) {
      this.styleguide.data.sections.map(function(section) {
        expect(section.modifiers(section.data.modifiers.length + 1)).to.be.false;
      });
      done();
    });

    it('should search by name when given a string', function(done) {
      this.styleguide.data.sections.map(function(section) {
        var i, j, queries = ['.red', '.yellow', ':hover', ':disabled'],
          q = queries.length,
          l = section.data.modifiers.length;

        // Loop through each modifier.
        for (i = 0; i < l; i += 1) {
          // If a modifier is equal to a query, run the search.
          for (j = 0; j < q; j += 1) {
            if (section.data.modifiers[i].data.name === queries[j]) {
              expect(section.modifiers(queries[j])).to.be.eql(section.data.modifiers[i]);
            }
          }
        }
      });
      done();
    });

    it('should return false if name not found', function(done) {
      this.styleguide.data.sections.map(function(section) {
        expect(section.modifiers('__should_not_find___')).to.be.false;
      });
      done();
    });
  });

  describe('.firstModifier()', function() {
    it('should return data.modifiers[0]', function(done) {
      this.styleguide.data.sections.map(function(section) {
        if (section.data.modifiers.length) {
          expect(section.firstModifier()).to.equal(section.modifiers(0));
        } else {
          expect(section.firstModifier()).to.be.false;
        }
      });
      done();
    });
  });

  describe('.parameters()', function() {
    it('should return data.parameters', function(done) {
      this.styleguide.data.sections.map(function(section) {
        expect(section.parameters()).to.equal(section.data.parameters);
      });
      done();
    });

    it('should return array of KssParameter', function(done) {
      this.styleguide.data.sections.map(function(section) {
        section.parameters().map(function(parameter) {
          expect(parameter).to.be.instanceof(kss.KssParameter);
        });
      });
      done();
    });
  });
});
