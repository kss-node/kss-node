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

	suite('#section', function() {
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
						'4.1.1', '4.1.2',
						'4.1.1.1', '4.1.1.2', '4.1.2.2',
						'8'
					];
				assert.ok(sections);
				for (key in sections) {
					results.push(sections[key].data.reference);
				}
				assert.deepEqual(results.sort(), expected.sort());
			});
		});
		suite('Exact References', function() {
			sectionQuery('Depth: 1', '4', options, function(styleguide, section) {
				assert.ok(section);
				assert.equal(section.data.header, 'DEPTH OF 1');
				assert.equal(section.data.refDepth, 1);
				assert.equal(section.data.reference, '4');
			});

			sectionQuery('Depth: 3 (No modifiers, should find)', '4.1.1', options, function(styleguide, section) {
				assert.ok(section);
				assert.equal(section.data.header, 'DEPTH OF 3, NO MODIFIERS');
				assert.equal(section.data.refDepth, 3);
				assert.equal(section.data.reference, '4.1.1');
			});

			sectionQuery('Depth: 3 (Modifiers, should find)', '4.1.2', options, function(styleguide, section) {
				assert.ok(section);
				assert.equal(section.data.header, 'DEPTH OF 3, MODIFIERS');
				assert.equal(section.data.refDepth, 3);
				assert.equal(section.data.reference, '4.1.2');
			});

			sectionQuery('Depth: 3 (Not found, should return false)', '4.1.3', options, function(styleguide, section) {
				assert.equal(section, false);
			});

			sectionQuery('Depth: 4 (A)', '4.1.1.1', options, function(styleguide, section) {
				assert.ok(section);
				assert.equal(section.data.header, 'DEPTH OF 4 (A)');
				assert.equal(section.data.refDepth, 4);
				assert.equal(section.data.reference, '4.1.1.1');
			});

			sectionQuery('Depth: 4 (B)', '4.1.1.2', options, function(styleguide, section) {
				assert.ok(section);
				assert.equal(section.data.header, 'DEPTH OF 4 (B)');
				assert.equal(section.data.refDepth, 4);
				assert.equal(section.data.reference, '4.1.1.2');
			});

			sectionQuery('Depth: 4 (C)', '4.1.2.2', options, function(styleguide, section) {
				assert.ok(section);
				assert.equal(section.data.header, 'DEPTH OF 4 (C)');
				assert.equal(section.data.refDepth, 4);
				assert.equal(section.data.reference, '4.1.2.2');
			});
		});
		suite('String Queries', function() {
			sectionQuery('4.1.x returns 4.1.1 and 4.1.2', '4.1.x', options, function(styleguide, sections) {
				assert.ok(sections);
				assert.equal(sections.length, 2);
				sections.map(function(section) {
					assert.ok(section.data.reference === '4.1.1' || section.data.reference === '4.1.2');
					assert.ok(section.data.header === 'DEPTH OF 3, NO MODIFIERS' || section.data.header === 'DEPTH OF 3, MODIFIERS');
				});
			});

			sectionQuery('4.1.* returns all descendants of 4.1', '4.1.*', options, function(styleguide, sections) {
				assert.ok(sections);
				assert.equal(sections.length, 5);
				sections.map(function(section){
					switch (section.data.reference) {
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
							throw new Error('Unexpected section!');
						break;
					}
				});
			});

			sectionQuery('Sections should be returned in order', '9.x', { mask: 'sections-order.less' }, function(styleguide, sections) {
				var i, l = sections.length;

				assert.equal(5, sections.length);
				
				for (i = 0; i < l; i += 1) {
					assert.equal( i+1, sections[i].data.reference.match(/[0-9]+$/g)[0] );
				}			
			});
		});
		suite('Regex Queries', function() {
			sectionQuery('/4.*/ returns section 4 and all of its descendants', /4.*/, options, function(styleguide, sections) {
				var references, expectedReferences = ['4', '4.1', '4.1.1', '4.1.2', '4.1.1.1', '4.1.1.2', '4.1.2.2'];

				references = sections.map(function(section) {
					return section.data.reference;
				});

				assert.deepEqual(references.sort(), expectedReferences.sort());
			});

			sectionQuery('/4/ only returns section 4', /4/, options, function(styleguide, sections) {
				assert.ok(sections);
				assert.equal(sections.length, 1);
				assert.equal(sections[0].data.reference, '4');
				assert.equal(sections[0].data.header, 'DEPTH OF 1');
			});

			sectionQuery('Sections should be returned in order', /9.*/, { mask: 'sections-order.less' }, function(styleguide, sections) {
				var i, l = sections.length;

				assert.equal(5, sections.length);
				
				for (i = 0; i < l; i += 1) {
					assert.equal( i+1, sections[i].data.reference.match(/[0-9]+$/g)[0] );
				}			
			});
		});
	});
});