var kss = require('../index.js'),
  KssStyleguide = kss.KssStyleguide,
  KssSection = kss.KssSection,
  KssModifier = kss.KssModifier,

  path = require('path'),
  assert = require('assert'),

  styleDirectory = path.normalize(__dirname + '/fixtures-styles/'),
  common = require('./common.js')(styleDirectory);

suite('KssStyleguide', function() {
  var sectionQuery = function(name, query, options, callback) {
    test(name, function(done) {
      kss.traverse(styleDirectory, options || {}, function(err, styleguide) {
        assert.ifError(err);
        callback(styleguide, styleguide.section(query));
        done();
      });
    });
  };

  common.hasMethod(new KssStyleguide({}), 'section');

  suite('.section()', function() {
    var options = { mask: 'section-queries.less' };
    suite('No Arguments', function() {
      sectionQuery('Should return only referenced sections', '', options, function(styleguide, sections) {
        var key, section;
        assert.ok(sections);
        for (key in sections) {
          section = sections[key];
          assert.ok(section.data.reference);
        }
      });
      sectionQuery('Should return all referenced sections', '', options, function(styleguide, sections) {
        var key, section, results = [],
          expected = [
            '4', '4.1',
            '4.1.1', '4.1.1.1', '4.1.1.2',
            '4.1.2', '4.1.2.2',
            '8'
          ];
        assert.ok(sections);
        for (key in sections) {
          results.push(sections[key].data.reference);
        }
        assert.deepEqual(results, expected);
      });
      sectionQuery('Should return all "word key" sections', '', { mask: 'sections-word-keys.less' }, function(styleguide, sections) {
        var key, section, results = [],
          expected = [
            'Base.Link',
            'Components', 'Components.Message', 'Components.Tabs',
            'Forms.Button', 'Forms.Input'
          ];
        assert.ok(sections);
        for (key in sections) {
          results.push(sections[key].data.reference);
        }
        assert.deepEqual(results, expected);
      });
      sectionQuery('Should return all "word phrases" sections', '', { mask: 'sections-word-phrases.less' }, function(styleguide, sections) {
        var key, section, results = [],
          expected = [
            'Base - Link',
            'Components', 'Components - Message box', 'Components - Tabs',
            'Forms - Button', 'Forms - Input field'
          ];
        assert.ok(sections);
        for (key in sections) {
          results.push(sections[key].data.reference);
        }
        assert.deepEqual(results, expected);
      });
    });
    suite('Exact References', function() {
      sectionQuery('Depth: 1', '4', options, function(styleguide, section) {
        assert.ok(section);
        assert.equal(section.data.header, 'DEPTH OF 1');
        assert.equal(section.data.depth, 1);
        assert.equal(section.data.reference, '4');
      });

      sectionQuery('Depth: 3 (No modifiers, should find)', '4.1.1', options, function(styleguide, section) {
        assert.ok(section);
        assert.equal(section.data.header, 'DEPTH OF 3, NO MODIFIERS');
        assert.equal(section.data.depth, 3);
        assert.equal(section.data.reference, '4.1.1');
      });

      sectionQuery('Depth: 3 (Modifiers, should find)', '4.1.2', options, function(styleguide, section) {
        assert.ok(section);
        assert.equal(section.data.header, 'DEPTH OF 3, MODIFIERS');
        assert.equal(section.data.depth, 3);
        assert.equal(section.data.reference, '4.1.2');
      });

      sectionQuery('Depth: 3 (Not found, should return false)', '4.1.3', options, function(styleguide, section) {
        assert.equal(section, false);
      });

      sectionQuery('Depth: 4 (A)', '4.1.1.1', options, function(styleguide, section) {
        assert.ok(section);
        assert.equal(section.data.header, 'DEPTH OF 4 (A)');
        assert.equal(section.data.depth, 4);
        assert.equal(section.data.reference, '4.1.1.1');
      });

      sectionQuery('Depth: 4 (B)', '4.1.1.2', options, function(styleguide, section) {
        assert.ok(section);
        assert.equal(section.data.header, 'DEPTH OF 4 (B)');
        assert.equal(section.data.depth, 4);
        assert.equal(section.data.reference, '4.1.1.2');
      });

      sectionQuery('Depth: 4 (C)', '4.1.2.2', options, function(styleguide, section) {
        assert.ok(section);
        assert.equal(section.data.header, 'DEPTH OF 4 (C)');
        assert.equal(section.data.depth, 4);
        assert.equal(section.data.reference, '4.1.2.2');
      });
    });
    suite('String Queries', function() {
      sectionQuery('4.x returns children of section 4', '4.x', options, function(styleguide, sections) {
        assert.ok(sections);
        sections.map(function(section) {
          assert.ok(section.data.reference === '4.1');
          assert.ok(section.data.header === 'DEPTH OF 2');
        });
        assert.equal(sections.length, 1);
      });

      sectionQuery('4.1.x returns children of section 4.1', '4.1.x', options, function(styleguide, sections) {
        assert.ok(sections);
        sections.map(function(section) {
          assert.ok(section.data.reference === '4.1.1' || section.data.reference === '4.1.2');
          assert.ok(section.data.header === 'DEPTH OF 3, NO MODIFIERS' || section.data.header === 'DEPTH OF 3, MODIFIERS');
        });
        assert.equal(sections.length, 2);
      });

      sectionQuery('4.x.x returns children and grandchildren of section 4', '4.x.x', options, function(styleguide, sections) {
        assert.ok(sections);
        sections.map(function(section) {
          assert.ok(section.data.reference === '4.1' || section.data.reference === '4.1.1' || section.data.reference === '4.1.2');
          assert.ok(section.data.header === 'DEPTH OF 2' || section.data.header === 'DEPTH OF 3, NO MODIFIERS' || section.data.header === 'DEPTH OF 3, MODIFIERS');
        });
        assert.equal(sections.length, 3);
      });

      sectionQuery('4.1.* returns 4.1 and all descendants', '4.1.*', options, function(styleguide, sections) {
        assert.ok(sections);
        sections.map(function(section){
          switch (section.data.reference) {
            case '4.1':
              assert.equal(section.data.header, 'DEPTH OF 2');
              break;
            case '4.1.1':
              assert.equal(section.data.header, 'DEPTH OF 3, NO MODIFIERS');
              break;
            case '4.1.2':
              assert.equal(section.data.header, 'DEPTH OF 3, MODIFIERS');
              break;
            case '4.1.1.1':
              assert.equal(section.data.header, 'DEPTH OF 4 (A)');
              break;
            case '4.1.1.2':
              assert.equal(section.data.header, 'DEPTH OF 4 (B)');
              break;
            case '4.1.2.2':
              assert.equal(section.data.header, 'DEPTH OF 4 (C)');
              break;
            default:
              throw new Error('Section ' + section.data.reference + ' was not expected!');
          }
        });
        assert.equal(sections.length, 6);
      });

      sectionQuery('alp.* does not match alpha', 'alp.*', { mask: 'sections-order.less' }, function(styleguide, sections) {
        assert.equal(sections.length, 0);
      });

      sectionQuery('alp.x does not match alpha', 'alp.x', { mask: 'sections-order.less' }, function(styleguide, sections) {
        assert.equal(sections.length, 0);
      });

      sectionQuery('Numeric sections should be returned in order', '9.x', { mask: 'sections-order.less' }, function(styleguide, sections) {
        var i,
          l = sections.length,
          expectedOrder = ['9.1', '9.2', '9.3', '9.4', '9.5', '9.10', '9.11', '9.100'];
        for (i = 0; i < l; i += 1) {
          assert.equal( sections[i].data.reference, expectedOrder[i] );
        }
        assert.equal(sections.length, 8);
      });

      sectionQuery('"Word key" sections should be returned in order', 'alpha.x', { mask: 'sections-order.less' }, function(styleguide, sections) {
        var i,
          l = sections.length,
          expectedOrder = ['alpha.alpha', 'alpha.beta', 'alpha.delta', 'alpha.epsilon', 'alpha.gamma'];
        for (i = 0; i < l; i += 1) {
          assert.equal( sections[i].data.reference, expectedOrder[i] );
        }
        assert.equal(sections.length, 5);
      });

      sectionQuery('"Word key" sections with dashes in the name should be returned', 'alpha-bet.*', { mask: 'sections-order.less' }, function(styleguide, sections) {
        assert.equal(sections.length, 1);
        assert.equal( sections[0].data.reference, 'alpha-bet' );
      });

      sectionQuery('"Word phrase" sections should be returned in order', 'beta.x', { mask: 'sections-order-word-phrases.less' }, function(styleguide, sections) {
        var i,
          l = sections.length,
          expectedOrder = ['beta - alpha', 'beta - beta', 'beta - delta', 'beta - epsilon', 'beta - gamma'];
        for (i = 0; i < l; i += 1) {
          assert.equal( sections[i].data.reference, expectedOrder[i] );
        }
        assert.equal(sections.length, 5);
      });
    });
    suite('Regex Queries', function() {
      sectionQuery('/4.*/ returns section 4 and all of its descendants', /4.*/, options, function(styleguide, sections) {
        var references, expectedReferences = ['4', '4.1', '4.1.1', '4.1.1.1', '4.1.1.2', '4.1.2', '4.1.2.2'];

        references = sections.map(function(section) {
          return section.data.reference;
        });

        assert.deepEqual(references, expectedReferences);
      });

      sectionQuery('/4/ only returns section 4', /4/, options, function(styleguide, sections) {
        assert.ok(sections);
        assert.equal(sections.length, 1);
        assert.equal(sections[0].data.reference, '4');
        assert.equal(sections[0].data.header, 'DEPTH OF 1');
      });

      sectionQuery('Numeric sections should be returned in order', /9.*/, { mask: 'sections-order.less' }, function(styleguide, sections) {
        var i,
          l = sections.length,
          expectedOrder = ['9', '9.1', '9.1.1', '9.2', '9.3', '9.4', '9.5', '9.10', '9.11', '9.100'];
        for (i = 0; i < l; i += 1) {
          assert.equal( sections[i].data.reference, expectedOrder[i] );
        }
        assert.equal(sections.length, 10);
      });

      sectionQuery('"Word key" sections should be returned in order', /alpha\..*/, { mask: 'sections-order.less' }, function(styleguide, sections) {
        var i,
          l = sections.length,
          expectedOrder = ['alpha.alpha', 'alpha.alpha.alpha', 'alpha.beta', 'alpha.delta', 'alpha.epsilon', 'alpha.gamma'];
        for (i = 0; i < l; i += 1) {
          assert.equal( sections[i].data.reference, expectedOrder[i] );
        }
        assert.equal(sections.length, 6);
      });

      sectionQuery('"Word phrase" sections should be returned in order', /beta - .*/, { mask: 'sections-order-word-phrases.less' }, function(styleguide, sections) {
        var i,
          l = sections.length,
          expectedOrder = ['beta - alpha', 'beta - alpha - alpha', 'beta - beta', 'beta - delta', 'beta - epsilon', 'beta - gamma'];
        for (i = 0; i < l; i += 1) {
          assert.equal( sections[i].data.reference, expectedOrder[i] );
        }
        assert.equal(sections.length, 6);
      });

      sectionQuery('Weighted "word phrase" sections should be returned in order', /gamma - .*/, { mask: 'sections-order-word-phrases.less' }, function(styleguide, sections) {
        var i,
          l = sections.length,
          expectedOrder = ['gamma - alpha', 'gamma - alpha - delta', 'gamma - alpha - gamma', 'gamma - alpha - beta', 'gamma - alpha - alpha', 'gamma - beta', 'gamma - gamma', 'gamma - delta', 'gamma - epsilon'];
        for (i = 0; i < l; i += 1) {
          assert.equal( sections[i].data.reference, expectedOrder[i] );
        }
        assert.equal(sections.length, 9);
      });

      sectionQuery('Autoincrement values for sections should be returned in order', /gamma - .*/, { mask: 'sections-order-word-phrases.less' }, function(styleguide, sections) {
        var i,
          l = sections.length,
          expectedOrder = ['2.1', '2.1.1', '2.1.2', '2.1.3', '2.1.4', '2.2', '2.3', '2.4', '2.5'];
        for (i = 0; i < l; i += 1) {
          assert.equal( sections[i].data.autoincrement, expectedOrder[i] );
        }
        assert.equal(sections.length, 9);
      });
    });
  });
});
