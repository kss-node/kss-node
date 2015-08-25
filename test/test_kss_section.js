/* eslint-disable max-nested-callbacks */

'use strict';

var custom = ['custom', 'custom2', 'custom property'];

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
    'parameters'
  ].forEach(function(method) {
    it('has ' + method + '() method', function(done) {
      (new kss.KssSection()).should.respondTo(method);
      done();
    });
  });
  /* eslint-enable guard-for-in,no-loop-func */

  describe('KssSection constructor', function() {
    it('should initialize the data', function(done) {
      var obj = new kss.KssSection();
      obj.should.have.property('styleguide');
      obj.should.have.property('data');
      obj.data.should.have.property('header');
      obj.data.should.have.property('description');
      obj.data.should.have.property('deprecated');
      obj.data.should.have.property('experimental');
      obj.data.should.have.property('reference');
      obj.data.should.have.property('depth');
      obj.data.should.have.property('weight');
      obj.data.should.have.property('referenceURI');
      obj.data.should.have.property('markup');
      obj.data.should.have.property('modifiers');
      obj.data.should.have.property('parameters');
      done();
    });

    it('should return a KssSection object when called normally', function(done) {
      /* eslint-disable new-cap */
      var obj = kss.KssSection();
      obj.should.be.an.instanceof(kss.KssSection);
      done();
      /* eslint-enable new-cap */
    });
  });

  describe('.toJSON()', function() {
    it('should return valid JSON object', function(done) {
      this.styleguide.data.sections.map(function(section) {
        var str;
        section.toJSON().should.be.an.instanceOf(Object);
        // Verify it converts to a JSON string.
        (function() {
          str = JSON.stringify(section.toJSON());
        }).should.not.throw();
        str.should.be.string;
        // Compare JSON string to original.
        JSON.parse(str).should.eql(section.toJSON());
      });
      done();
    });

    it('should return custom properties given array of property names', function(done) {
      this.styleguide.data.sections.map(function(section) {
        var str;
        section.toJSON(custom).should.be.an.instanceOf(Object);
        // Verify it converts to a JSON string.
        (function() {
          str = JSON.stringify(section.toJSON(custom));
        }).should.not.throw();
        str.should.be.string;
        // Compare JSON string to original.
        JSON.parse(str).should.eql(section.toJSON(custom));
      });
      done();
    });
  });

  describe('.header()', function() {
    it('should return data.header', function(done) {
      this.styleguide.data.sections.map(function(section) {
        section.header().should.be.equal(section.data.header);
      });
      done();
    });
  });

  describe('.description()', function() {
    it('should return data.description', function(done) {
      this.styleguide.data.sections.map(function(section) {
        section.description().should.be.equal(section.data.description);
      });
      done();
    });
  });

  describe('.deprecated()', function() {
    it('should return data.deprecated', function(done) {
      this.styleguide.data.sections.map(function(section) {
        section.deprecated().should.be.equal(section.data.deprecated);
      });
      done();
    });
  });

  describe('.experimental()', function() {
    it('should return data.experimental', function(done) {
      this.styleguide.data.sections.map(function(section) {
        section.experimental().should.be.equal(section.data.experimental);
      });
      done();
    });
  });

  describe('.reference()', function() {
    it('should return data.reference', function(done) {
      this.styleguide.data.sections.map(function(section) {
        section.reference().should.be.equal(section.data.reference);
      });
      done();
    });
  });

  describe('.depth()', function() {
    it('should return data.depth', function(done) {
      this.styleguide.data.sections.map(function(section) {
        section.depth().should.be.equal(section.data.depth);
        section.depth().should.be.equal(section.reference().split(section.styleguide.referenceDelimiter).length);
        section.depth().should.be.at.least(0);
      });
      done();
    });
  });

  describe('.weight()', function() {
    it('should return data.weight', function(done) {
      this.styleguide.data.sections.map(function(section) {
        section.weight().should.be.equal(section.data.weight ? section.data.weight : 0);
        section.weight().should.be.at.least(-100000);
      });
      done();
    });
  });

  describe('.encodeReferenceURI()', function() {
    it('should return .referenceURI() when given reference()', function(done) {
      this.styleguide.data.sections.map(function(section) {
        section.encodeReferenceURI(section.reference()).should.be.equal(section.referenceURI());
      });
      done();
    });
  });

  describe('.referenceURI()', function() {
    it('should return data.referenceURI', function(done) {
      this.styleguide.data.sections.map(function(section) {
        section.referenceURI().should.be.equal(section.data.referenceURI);
        section.referenceURI().should.be.equal(section.encodeReferenceURI(section.reference()));
      });
      done();
    });

    it('should replace all runs of non-word characters with a hyphen', function() {
      var section = new kss.KssSection();
      section.encodeReferenceURI('test - section - with.multiple.runs..of--non-word.characters').should.be.equal('test-section-with-multiple-runs-of--non-word-characters');
    });
  });

  describe('.modifiers()', function() {
    it('should return data.modifiers', function(done) {
      this.styleguide.data.sections.map(function(section) {
        section.modifiers().should.be.equal(section.data.modifiers);
      });
      done();
    });

    it('should return array of KssModifier', function(done) {
      this.styleguide.data.sections.map(function(section) {
        section.modifiers().map(function(modifier) {
          modifier.should.be.instanceof(kss.KssModifier);
        });
      });
      done();
    });

    it('should return data.modifiers[n] given an integer as number or string', function(done) {
      this.styleguide.data.sections.map(function(section) {
        var i = 0;
        section.data.modifiers.map(function(modifier) {
          section.modifiers(i).should.be.eql(modifier);
          section.modifiers(i.toString()).should.be.eql(modifier);
          i++;
        });
      });
      done();
    });

    it('should return false if number is not found', function(done) {
      this.styleguide.data.sections.map(function(section) {
        section.modifiers(section.data.modifiers.length + 1).should.be.false;
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
              section.modifiers(queries[j]).should.be.eql(section.data.modifiers[i]);
            }
          }
        }
      });
      done();
    });

    it('should return false if name not found', function(done) {
      this.styleguide.data.sections.map(function(section) {
        section.modifiers('__should_not_find___').should.be.false;
      });
      done();
    });
  });

  describe('.firstModifier()', function() {
    it('should return data.modifiers[0]', function(done) {
      this.styleguide.data.sections.map(function(section) {
        if (section.data.modifiers.length) {
          section.firstModifier().should.be.equal(section.modifiers(0));
        } else {
          section.firstModifier().should.be.false;
        }
      });
      done();
    });
  });

  describe('.parameters()', function() {
    it('should return data.parameters', function(done) {
      this.styleguide.data.sections.map(function(section) {
        section.parameters().should.be.equal(section.data.parameters);
      });
      done();
    });

    it('should return array of KssParameter', function(done) {
      this.styleguide.data.sections.map(function(section) {
        section.parameters().map(function(parameter) {
          parameter.should.be.instanceof(kss.KssParameter);
        });
      });
      done();
    });
  });
});
