/*global describe,it,before*/
/*eslint-disable max-nested-callbacks*/

'use strict';

var kss = require('../index.js'),
  testUtils = require('./testUtils');

describe('KssSection object API', function() {
  before(function(done) {
    var self = this;
    testUtils.traverseFixtures({mask: '*.less|*.css'}, function(styleguide) {
      self.styleguide = styleguide;
      done();
    });
  });

  /*eslint-disable guard-for-in,no-loop-func*/
  [
    'header',
    'description',
    'deprecated',
    'experimental',
    'reference',
    'depth',
    'encodeReferenceURI',
    'referenceURI',
    'modifiers',
    'firstModifier'
  ].forEach(function(method) {
    it('has ' + method + '() method', function() {
      (new kss.KssSection({})).should.have.method(method);
    });
  });
  /*eslint-enable guard-for-in,no-loop-func*/

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
        section.depth().should.be.a.Number();
      });
      done();
    });
  });

  describe('.weight()', function() {
    it('should return data.weight', function(done) {
      this.styleguide.data.sections.map(function(section) {
        section.weight().should.be.equal(section.data.weight ? section.data.weight : 0);
        section.weight().should.be.a.Number();
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

    it('should return data.modifiers[n] or false if non-existent when given (n)', function(done) {
      this.styleguide.data.sections.map(function(section) {
        var i, l = section.data.modifiers.length;

        // Search for section for all n sections plus one that doesn't exist.
        for (i = 0; i < l + 1; i++) {
          if (i < l) {
            section.modifiers(i).should.be.eql(section.data.modifiers[i]);
          } else {
            section.modifiers(i).should.be.false();
          }
        }
      });
      done();
    });

    it('should search by name when given "modifier"', function(done) {
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

    it('should return false if not found', function(done) {
      this.styleguide.data.sections.map(function(section) {
        section.modifiers('__should_not_find___').should.be.false();
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
          section.firstModifier().should.be.false();
        }
      });
      done();
    });
  });
});
