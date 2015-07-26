/*global describe,context,it*/
/*eslint-disable max-nested-callbacks*/

'use strict';

var kss = require('../index.js'),
  testUtils = require('./testUtils');

var query = '',
  options = {mask: 'sections-queries.less'};

describe('KssStyleguide object API', function() {
  /*eslint-disable guard-for-in,no-loop-func*/
  [
    'init',
    'section',
    'sortSections',
    'getWeight'
  ].forEach(function(method) {
    it('has ' + method + '() method', function() {
      (new kss.KssStyleguide({})).should.have.method(method);
    });
  });
  /*eslint-enable guard-for-in,no-loop-func*/

  describe('.section()', function() {

    context('given no arguments', function() {
      it('should return only referenced sections', function(done) {
        testUtils.sectionQueryArray(done, query, options, function(sections) {
          sections.map(function(section) {
            section.data.should.have.property('reference');
          });
        });
      });

      it('should return all referenced sections', function(done) {
        testUtils.sectionQueryArray(done, query, options, function(sections) {
          var results = [],
            expected = [
              '4', '4.1',
              '4.1.1', '4.1.1.1', '4.1.1.2',
              '4.1.2', '4.1.2.2',
              '8'
            ];
          sections.map(function(section) {
            results.push(section.reference());
          });
          results.should.be.eql(expected);
        });
      });

      it('should return all "word key" sections', function(done) {
        testUtils.sectionQueryArray(done, query, {mask: 'property-styleguide-word-keys.less'}, function(sections) {
          var results = [],
            expected = [
              'WordKeys.Base.Link',
              'WordKeys.Components',
              'WordKeys.Components.Message',
              'WordKeys.Components.Tabs',
              'WordKeys.Forms.Button',
              'WordKeys.Forms.Input'
            ];
          sections.map(function(section) {
            results.push(section.reference());
          });
          results.should.be.eql(expected);
        });
      });

      it('should return all "word phrases" sections', function(done) {
        testUtils.sectionQueryArray(done, query, {mask: 'property-styleguide-word-phrases.less'}, function(sections) {
          var results = [],
            expected = [
              'WordPhrases - Base - Link',
              'WordPhrases - Components',
              'WordPhrases - Components - Message box',
              'WordPhrases - Components - Tabs',
              'WordPhrases - Forms - Button',
              'WordPhrases - Forms - Input field'
            ];
          sections.map(function(section) {
            results.push(section.reference());
          });
          results.should.be.eql(expected);
        });
      });
    });

    context('given exact references', function() {
      it('should find a reference with depth 1', function(done) {
        testUtils.sectionQueryExact(done, '4', options, function(section) {
          section.header().should.be.equal('DEPTH OF 1');
          section.depth().should.be.equal(1);
          section.reference().should.be.equal('4');
        });
      });

      it('should find a reference with depth 3 and no modifiers', function(done) {
        testUtils.sectionQueryExact(done, '4.1.1', options, function(section) {
          section.header().should.be.equal('DEPTH OF 3, NO MODIFIERS');
          section.depth().should.be.equal(3);
          section.reference().should.be.equal('4.1.1');
        });
      });

      it('should find a reference with depth 3 and modifiers', function(done) {
        testUtils.sectionQueryExact(done, '4.1.2', options, function(section) {
          section.header().should.be.equal('DEPTH OF 3, MODIFIERS');
          section.depth().should.be.equal(3);
          section.reference().should.be.equal('4.1.2');
        });
      });

      it('should not find a reference with depth 3 that does not exist', function(done) {
        testUtils.sectionQueryFail(done, '4.1.3', options);
      });

      it('should find a reference with depth 4 (A)', function(done) {
        testUtils.sectionQueryExact(done, '4.1.1.1', options, function(section) {
          section.header().should.be.equal('DEPTH OF 4 (A)');
          section.depth().should.be.equal(4);
          section.reference().should.be.equal('4.1.1.1');
        });
      });

      it('should find a reference with depth 4 (B)', function(done) {
        testUtils.sectionQueryExact(done, '4.1.1.2', options, function(section) {
          section.header().should.be.equal('DEPTH OF 4 (B)');
          section.depth().should.be.equal(4);
          section.reference().should.be.equal('4.1.1.2');
        });
      });

      it('should find a reference with depth 4 (C)', function(done) {
        testUtils.sectionQueryExact(done, '4.1.2.2', options, function(section) {
          section.header().should.be.equal('DEPTH OF 4 (C)');
          section.depth().should.be.equal(4);
          section.reference().should.be.equal('4.1.2.2');
        });
      });
    });

    context('given string queries', function() {
      it('should return 1 level of descendants when given "4.x"', function(done) {
        testUtils.sectionQueryArray(done, '4.x', options, function(sections) {
          sections.map(function(section) {
            section.reference().should.equal('4.1');
            section.header().should.equal('DEPTH OF 2');
          });
          sections.length.should.equal(1);
        });
      });

      it('should return 1 level of descendants when given "4.1.x"', function(done) {
        testUtils.sectionQueryArray(done, '4.1.x', options, function(sections) {
          var results,
            expected = ['4.1.1', '4.1.2'];
          results = sections.map(function(section) {
            return section.reference();
          });
          results.should.eql(expected);
        });
      });

      it('should return 2 levels of descendants when given "4.x.x"', function(done) {
        testUtils.sectionQueryArray(done, '4.x.x', options, function(sections) {
          var results,
            expected = ['4.1', '4.1.1', '4.1.2'];
          results = sections.map(function(section) {
            return section.reference();
          });
          results.should.eql(expected);
        });
      });

      it('should return "4.1" and all levels of descendants when given "4.1.*"', function(done) {
        testUtils.sectionQueryArray(done, '4.1.*', options, function(sections) {
          var results,
            expected = ['4.1', '4.1.1', '4.1.1.1', '4.1.1.2', '4.1.2', '4.1.2.2'];
          results = sections.map(function(section) {
            return section.reference();
          });
          results.should.eql(expected);
        });
      });

      it('should not find "alpha" section when given a query for "alp.*"', function(done) {
        testUtils.sectionQueryFail(done, 'alp.*', {mask: 'sections-order.less'});
      });

      it('should not find "alpha" section when given a query for "alp.x"', function(done) {
        testUtils.sectionQueryFail(done, 'alp.x', {mask: 'sections-order.less'});
      });

      it('should return numeric sections in order', function(done) {
        testUtils.sectionQueryArray(done, '9.x', {mask: 'sections-order.less'}, function(sections) {
          var results,
            expected = ['9.1', '9.2', '9.3', '9.4', '9.5', '9.10', '9.11', '9.100'];
          results = sections.map(function(section) {
            return section.reference();
          });
          results.should.eql(expected);
        });
      });

      it('should return "word key" sections in order', function(done) {
        testUtils.sectionQueryArray(done, 'alpha.x', {mask: 'sections-order.less'}, function(sections) {
          var results,
            expected = ['alpha.alpha', 'alpha.beta', 'alpha.delta', 'alpha.epsilon', 'alpha.gamma'];
          results = sections.map(function(section) {
            return section.reference();
          });
          results.should.eql(expected);
        });
      });

      it('should return "word key" sections with dashes in the name', function(done) {
        testUtils.sectionQueryArray(done, 'alpha-bet.*', {mask: 'sections-order.less'}, function(sections) {
          sections.map(function(section) {
            section.reference().should.equal('alpha-bet');
          });
          sections.length.should.equal(1);
        });
      });

      it('should return "word phrase" sections in order', function(done) {
        testUtils.sectionQueryArray(done, 'beta.x', {mask: 'sections-order-word-phrases.less'}, function(sections) {
          var results,
            expected = ['beta - alpha', 'beta - beta', 'beta - delta', 'beta - epsilon', 'beta - gamma'];
          results = sections.map(function(section) {
            return section.reference();
          });
          results.should.eql(expected);
        });
      });
    });

    context('given regex queries', function() {
      it('should return "4" and all levels of descendants when given /4.*/', function(done) {
        testUtils.sectionQueryArray(done, /4.*/, options, function(sections) {
          var results,
            expected = ['4', '4.1', '4.1.1', '4.1.1.1', '4.1.1.2', '4.1.2', '4.1.2.2'];
          results = sections.map(function(section) {
            return section.reference();
          });
          results.should.eql(expected);
        });
      });

      it('should return "4" when given /4/', function(done) {
        testUtils.sectionQueryArray(done, /4/, options, function(sections) {
          sections.map(function(section) {
            section.reference().should.equal('4');
          });
          sections.length.should.equal(1);
        });
      });

      it('should return numeric sections in order', function(done) {
        testUtils.sectionQueryArray(done, /9.*/, {mask: 'sections-order.less'}, function(sections) {
          var results,
            expected = ['9', '9.1', '9.1.1', '9.2', '9.3', '9.4', '9.5', '9.10', '9.11', '9.100'];
          results = sections.map(function(section) {
            return section.reference();
          });
          results.should.eql(expected);
        });
      });

      it('should return "word key" sections in order', function(done) {
        testUtils.sectionQueryArray(done, /alpha\..*/, {mask: 'sections-order.less'}, function(sections) {
          var results,
            expected = ['alpha.alpha', 'alpha.alpha.alpha', 'alpha.beta', 'alpha.delta', 'alpha.epsilon', 'alpha.gamma'];
          results = sections.map(function(section) {
            return section.reference();
          });
          results.should.eql(expected);
        });
      });

      it('should return "word phrase" sections in order', function(done) {
        testUtils.sectionQueryArray(done, /beta - .*/, {mask: 'sections-order-word-phrases.less'}, function(sections) {
          var results,
            expected = ['beta - alpha', 'beta - alpha - alpha', 'beta - beta', 'beta - delta', 'beta - epsilon', 'beta - gamma'];
          results = sections.map(function(section) {
            return section.reference();
          });
          results.should.eql(expected);
        });
      });

      it('should return weighted "word phrase" sections in order', function(done) {
        testUtils.sectionQueryArray(done, /gamma - .*/, {mask: 'sections-order-word-phrases.less'}, function(sections) {
          var results,
            expected = ['gamma - alpha', 'gamma - alpha - delta', 'gamma - alpha - gamma', 'gamma - alpha - beta', 'gamma - alpha - alpha', 'gamma - beta', 'gamma - gamma', 'gamma - delta', 'gamma - epsilon'];
          results = sections.map(function(section) {
            return section.reference();
          });
          results.should.eql(expected);
        });
      });

      it('should return autoincrement values for "word phrase" sections in order', function(done) {
        testUtils.sectionQueryArray(done, /gamma - .*/, {mask: 'sections-order-word-phrases.less'}, function(sections) {
          var results,
            expected = ['2.1', '2.1.1', '2.1.2', '2.1.3', '2.1.4', '2.2', '2.3', '2.4', '2.5'];
          results = sections.map(function(section) {
            return section.data.autoincrement;
          });
          results.should.eql(expected);
        });
      });
    });
  });
});
