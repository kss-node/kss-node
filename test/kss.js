/*global suite, test, setup, teardown*/
var kss = require('../index.js'),
	path = require('path'),
	walk = require('../lib/walk.js'),
	fs = require('fs'),
	marked = require('marked'),
	util = require('util'),
	KssStyleguide = kss.KssStyleguide,
	KssSection = kss.KssSection,
	KssModifier = kss.KssModifier,
	styleDirectory = path.normalize(__dirname + '/fixtures-styles/'),
	assert = require('assert'),
	common = require('./common.js')(styleDirectory);

suite('Public Method/Class Check', function() {
	common.hasMethod(kss, 'parse');
	common.hasMethod(kss, 'traverse');
	common.hasMethod(kss, 'KssSection');
	common.hasMethod(kss, 'KssModifier');
	common.hasMethod(kss, 'KssStyleguide');
});

suite('#traverse', function() {
	suite('API/Validation Checks', function(done) {
		test('Should function with and without options', function(done) {
			kss.traverse(styleDirectory, function(err, sga) {
				assert.ifError(err);
				kss.traverse(styleDirectory, {}, function(err, sgb) {
					assert.ifError(err);
					// Need to find an alternative for this test.
					// At the moment it gets stuck asserting recursively.
					// assert.deepEqual(sga, sgb);
					done();
				});
			});
		});
		test('Should throw an error without a callback (for now)', function() {
			assert.throws(function() {
				kss.traverse(styleDirectory, {});
			});
		});
	});
	suite('styleguide.data', function() {
		suite('.files:', function() {
			test('should reflect files found', function(done) {
				var maskAll = /.*/g;

				kss.traverse(styleDirectory, { mask: maskAll }, function(err, styleguide) {
					assert.ok(styleguide.data);
					assert.ok(Array.isArray(styleguide.data.files));
					assert.ok(styleguide.data.files.length > 0);

					walk(styleDirectory, { mask: maskAll }, {
						file: function(file) {
							var i, l = styleguide.data.files.length, safe = false;
							file = file.replace(/\\/g, '/');
							assert.notEqual(styleguide.data.files.indexOf(file), -1);
						},
						finished: function(err) {
							assert.ifError(err);
							done();
						}
					});
				});
			});
		});
		suite('.body:', function() {
			test('is present, string', function(done) {
				kss.traverse(styleDirectory, function(err, styleguide) {
					assert.ifError(err);
					assert.ok(!(styleguide.data.body instanceof Buffer));
					assert.equal(typeof styleguide.data.body, 'string');
					done();
				});
			});
			test('contains contents of all found files', function(done) {
				var maskAll = /.*/g, fileReader, fileCounter, sg;

				kss.traverse(styleDirectory, function(err, styleguide) {
					var i, l;

					assert.ifError(err);
					assert.ok(!(styleguide.data.body instanceof Buffer));

					sg = styleguide;

					l = fileCounter = styleguide.data.files.length;
					for (i = 0; i < l; i += 1) {
						fs.readFile(styleguide.data.files[i], 'utf8', fileReader);
					}
				});

				fileReader = function(err, data) {
					fileCounter -= 1;

					assert.notEqual(sg.data.body.indexOf(data), -1);

					if (!fileCounter) {
						done();
					}
				};
			});
		});
		suite('.sections[]:', function() {
			suite('.raw', function() {
				setup(function(done) {
					var self = this;

					kss.traverse(styleDirectory, function(err, styleguide) {
						assert.ifError(err);

						assert.ok(styleguide.data.sections);

						self.guide = styleguide;
						self.data = styleguide.data;
						done();
					});
				});

				test('each comment block in the array should be from .data.body (disregarding whitespace)', function() {
					var id, section, data = this.data,
						filteredBody = data.body.replace(/\/\/|\/\*|\*\/|\s/g, '');

					for (id in data.sections) {
						section = data.sections[id];
						assert.notEqual(filteredBody.indexOf(section.data.raw.replace(/\s/g, '')), -1);
					}
				});
			});
			suite('.description/.header', function() {
				common.testSection('One line, no modifiers', 'sections-description.less', function(section) {
					assert.equal(section.data.header.toUpperCase(), 'ONE LINE, NO MODIFIERS');
					assert.equal(section.data.description.toUpperCase(), '');
				});

				common.testSection('One line, multiple modifiers', 'sections-description.less', function(section) {
					assert.equal(section.data.header.toUpperCase(), 'ONE LINE, MULTIPLE MODIFIERS');
					assert.equal(section.data.description.toUpperCase(), '');
				});

				common.testSection('Header Detection', 'sections-description.less', function(section) {
					assert.equal(section.data.header.toUpperCase(), 'HEADER DETECTION');
					assert.equal(section.data.description.toUpperCase(), 'SEPARATE PARAGRAPH');
				});

				common.testSection('Two paragraphs, multiple modifiers', 'sections-description.less', function(section) {
					assert.equal(section.data.header.toUpperCase(), 'TWO PARAGRAPHS, MULTIPLE MODIFIERS');
					assert.equal(section.data.description.toUpperCase(), 'LIKE SO');
				});

				common.testSection('Two lines, multiple modifiers like so', 'sections-description.less', function(section) {
					assert.equal(section.data.header.toUpperCase(), 'TWO LINES, MULTIPLE MODIFIERS LIKE SO');
					assert.equal(section.data.description.toUpperCase(), '');
				});
				common.testSection('Three paragraphs, no modifiers', 'sections-description.less', function(section) {
					assert.equal(section.data.header.toUpperCase(), 'THREE PARAGRAPHS, NO MODIFIERS');
					assert.equal(section.data.description.toUpperCase(), 'ANOTHER PARAGRAPH\n\nAND ANOTHER');
				});
			});
			suite('.modifiers', function() {
				common.testSection('No modifiers', 'sections-modifiers.less', function(section) {
					var modifiers = section.data.modifiers;
					assert.equal(modifiers.length, 0);
				});

				common.testSection('Single White Space', 'sections-modifiers.less', function(section) {
					var modifiers = section.data.modifiers;
					assert.equal(modifiers.length, 2);
					assert.equal(modifiers[0].data.name, ':hover');
					assert.equal(modifiers[0].data.description, 'HOVER');
					assert.equal(modifiers[1].data.name, ':disabled');
					assert.equal(modifiers[1].data.description, 'DISABLED');
				});

				common.testSection('Variable White Space', 'sections-modifiers.less', function(section) {
					var modifiers = section.data.modifiers;
					assert.equal(modifiers.length, 2);
					assert.equal(modifiers[0].data.name, ':hover');
					assert.equal(modifiers[0].data.description, 'HOVER');
					assert.equal(modifiers[1].data.name, ':disabled');
					assert.equal(modifiers[1].data.description, 'DISABLED');
				});

				common.testSection('Classes', 'sections-modifiers.less', function(section) {
					var modifiers = section.data.modifiers;
					assert.equal(modifiers.length, 3);
					assert.equal(modifiers[0].data.name, '.red');
					assert.equal(modifiers[0].data.description, 'MAKE IT RED');
					assert.equal(modifiers[1].data.name, '.yellow');
					assert.equal(modifiers[1].data.description, 'MAKE IT YELLOW');
					assert.equal(modifiers[2].data.name, '.red.yellow');
					assert.equal(modifiers[2].data.description, 'MAKE IT ORANGE');
				});

				common.testSection('Elements', 'sections-modifiers.less', function(section) {
					var modifiers = section.data.modifiers;
					assert.equal(modifiers.length, 3);
					assert.equal(modifiers[0].data.name, 'a');
					assert.equal(modifiers[0].data.description, 'Contains the image replacement');
					assert.equal(modifiers[1].data.name, 'span');
					assert.equal(modifiers[1].data.description, 'Hidden');
					assert.equal(modifiers[2].data.name, 'a span');
					assert.equal(modifiers[2].data.description, 'Two elements');
				});

				common.testSection('Classes and elements', 'sections-modifiers.less', function(section) {
					var modifiers = section.data.modifiers;
					assert.equal(modifiers.length, 5);
				});

				common.testSection('More than one dash', 'sections-modifiers.less', function(section) {
					var modifiers = section.data.modifiers;
					assert.equal(modifiers.length, 3);
					assert.equal(modifiers[0].data.name, '.red');
					assert.equal(modifiers[0].data.description, 'Color - red');
					assert.equal(modifiers[1].data.name, '.yellow');
					assert.equal(modifiers[1].data.description, 'Color  -  yellow');
					assert.equal(modifiers[2].data.name, '.blue');
					assert.equal(modifiers[2].data.description, 'Color - blue  -  another dash');
				});

				common.testSection('One line, no modifiers', 'sections-description.less', function(section) {
					var modifiers = section.data.modifiers;
					assert.equal(modifiers.length, 0);
				});

				common.testSection('Two paragraphs, multiple modifiers', 'sections-description.less', function(section) {
					var modifiers = section.data.modifiers;
					assert.equal(modifiers.length, 2);
				});

				common.testSection('Two lines, multiple modifiers like so', 'sections-description.less', function(section) {
					var modifiers = section.data.modifiers;
					assert.equal(modifiers.length, 3);
				});

				common.testSection('Three paragraphs, no modifiers', 'sections-description.less', function(section) {
					var modifiers = section.data.modifiers;
					assert.equal(modifiers.length, 0);
				});

				suite('.data.className', function() {
					common.testAllSections('Convert pseudo-classes', '*.less|*.css', function(section) {
						var modifiers = section.data.modifiers,
							i, l = modifiers.length,
							currentData;

						for (i = 0; i < l; i += 1) {
							currentData = modifiers[i].data
							assert.equal(
								currentData.name.replace(/\:/, '.pseudo-class-'),
								currentData.className
							);
						}
					});
				});
			});
			suite('.deprecated', function() {
				common.testSection('Deprecated: Spacing above and below', 'sections-status.less', function(section) {
					assert.ok(section.data.deprecated);
				}, 'Still works with vertical line space', { multiline: true});

				common.testSection('Deprecated: In Header', 'sections-status.less', function(section) {
					assert.ok(section.data.deprecated);
				}, 'Works when included in header', { multiline: true});

				common.testSection('In Paragraph (deprecated)', 'sections-status.less', function(section) {
					assert.ok(section.data.deprecated);
				}, 'Works when included at the beginning of a paragraph', { multiline: true});

				common.testSection('In Modifiers (deprecated)', 'sections-status.less', function(section) {
					assert.ok(!section.data.deprecated);
				}, 'Won\'t work when included in a modifier description', { multiline: true});

				common.testSection('Not at the beginning, deprecated: nope', 'sections-status.less', function(section) {
					assert.ok(!section.data.deprecated);
				}, 'Only works when included at the beginning of a paragraph/header', { multiline: true});
			});
			suite('.experimental', function() {

				common.testSection('Experimental: Spacing above and below', 'sections-status.less', function(section) {
					assert.ok(section.data.experimental);
				}, 'Still works with vertical line space', { multiline: true});

				common.testSection('Experimental: In Header', 'sections-status.less', function(section) {
					assert.ok(section.data.experimental);
				}, 'Works when included in header', { multiline: true});

				common.testSection('In Paragraph (experimental)', 'sections-status.less', function(section) {
					assert.ok(section.data.experimental);
				}, 'Works when included at the beginning of a paragraph', { multiline: true});

				common.testSection('In Modifiers (experimental)', 'sections-status.less', function(section) {
					assert.ok(!section.data.experimental);
				}, 'Won\'t work when included in a modifier description', { multiline: true});

				common.testSection('Not at the beginning, experimental: nope', 'sections-status.less', function(section) {
					assert.ok(!section.data.experimental);
				}, 'Only works when included at the beginning of a paragraph/header', { multiline: true});
			});
			suite('.reference', function() {
				common.testSection('Reference with trailing zero...', 'section-queries.less', function(section) {
					assert.equal(section.data.reference, '8');
				}, 'Sections labelled "X.0" should be equivalent to "X"', { multiline: true });
			});
		});
	});
	suite('options', function() {
		suite('.markup', function() {
			common.testSection('Second paragraph', 'options-markup.less', function(section) {
				assert.equal(
					section.data.markup.toLowerCase(),
					'<a href="#" class="{$modifiers}">Hello World</a>'.toLowerCase()
				);

				assert.equal(section.data.reference, '7.1');
				assert.equal(section.data.modifiers.length, 3);
				assert.equal(section.data.description, '');
			}, false, { markup: true });

			common.testSection('Below modifiers', 'options-markup.less', function(section) {
				assert.equal(
					section.data.markup.toLowerCase(),
					'<a href="#" class="{$modifiers}">Lorem Ipsum</a>'.toLowerCase()
				);
			});

			test('Don\'t inerfere with content when at the top', function(done) {
				kss.traverse(styleDirectory, { markup: true }, function(err, styleguide) {
					var section = styleguide.section('7.3');

					assert.equal(section.data.reference, '7.3');
					assert.equal(section.data.header, 'Don\'t be the header');
					assert.equal(section.data.markup, '<h1 class="{$modifiers}">Header</h1>');
					assert.equal(section.data.modifiers[0].data.name, '.title');
					done();
				});
			});
		});
		suite('.mask:', function() {
			suite('Default', function() {
				common.shouldFindFile('style.css', {}, true);
				common.shouldFindFile('style.less', {}, true);
				common.shouldFindFile('style.stylus', {}, true);
				common.shouldFindFile('style.styl', {}, true);
				common.shouldFindFile('style.sass', {}, true);
				common.shouldFindFile('includes/buttons.less', {}, true);
				common.shouldFindFile('includes/buttons.js', {}, false);
			});
			suite('.js (regex)', function() {
				common.shouldFindFile('includes/buttons.js', { mask: /\.js/ }, true);
				common.shouldFindFile('includes/buttons.less', { mask: /\.js/ }, false);
				common.shouldFindFile('style.css', { mask: /\.js/ }, false);
			});
			suite('*.js (string)', function() {
				common.shouldFindFile('includes/buttons.js', { mask: '*.js' }, true);
				common.shouldFindFile('includes/buttons.less', { mask: '*.js' }, false);
				common.shouldFindFile('style.css', { mask: '*.js' }, false);
			});
			suite('.js|.less|.css (regex)', function() {
				common.shouldFindFile('includes/buttons.js', { mask: /\.js|\.less|\.css/ }, true);
				common.shouldFindFile('includes/buttons.less', { mask: /\.js|\.less|\.css/ }, true);
				common.shouldFindFile('style.css', { mask: /\.js|\.less|\.css/ }, true);
			});
			suite('*.js|*.less|*.css (string)', function() {
				common.shouldFindFile('includes/buttons.js', { mask: '*.js|*.less|*.css' }, true);
				common.shouldFindFile('includes/buttons.less', { mask: '*.js|*.less|*.css' }, true);
				common.shouldFindFile('style.css', { mask: '*.js|*.less|*.css' }, true);
			});
		});
		suite('.markdown', function() {
			common.testSection('Three paragraphs, no modifiers', 'sections-description.less', function(section) {
				assert.equal(section.data.description, marked('ANOTHER PARAGRAPH\n\nAND ANOTHER'));
			}, 'Formats when enabled', { markdown : true });
			common.testSection('Three paragraphs, no modifiers', 'sections-description.less', function(section) {
				assert.equal(section.data.description, 'ANOTHER PARAGRAPH\n\nAND ANOTHER');
			}, 'Doesn\'t format when disabled', { markdown : false });
			common.testSection('Three paragraphs, no modifiers', 'sections-description.less', function(section) {
				assert.equal(section.data.description, 'ANOTHER PARAGRAPH\n\nAND ANOTHER');
			}, 'Disabled by default');
		});
		suite('.multiline (disabled)', function() {
			common.testSection('One line, no modifiers', 'sections-description.less', function(section) {
				assert.ok(section.data.description.toUpperCase(), 'ONE LINE, NO MODIFIERS');
			}, false, { multiline: false });

			common.testSection('One line, multiple modifiers', 'sections-description.less', function(section) {
				assert.equal(section.data.description.toUpperCase(), 'ONE LINE, MULTIPLE MODIFIERS');
			}, false, { multiline: false });

			common.testSection('Header Detection', 'sections-description.less', function(section) {
				assert.equal(section.data.description.toUpperCase(), 'HEADER DETECTION\n\nSEPARATE PARAGRAPH');
			}, false, { multiline: false });

			common.testSection('Two paragraphs, multiple modifiers', 'sections-description.less', function(section) {
				assert.equal(section.data.description.toUpperCase(), 'TWO PARAGRAPHS, MULTIPLE MODIFIERS\n\nLIKE SO');
			}, false, { multiline: false });

			common.testSection('Two lines, multiple modifiers like so', 'sections-description.less', function(section) {
				assert.equal(section.data.description.toUpperCase(), 'TWO LINES, MULTIPLE MODIFIERS\nLIKE SO');
			}, false, { multiline: false });
			common.testSection('Three paragraphs, no modifiers', 'sections-description.less', function(section) {
				assert.equal(section.data.description.toUpperCase(), 'THREE PARAGRAPHS, NO MODIFIERS\n\nANOTHER PARAGRAPH\n\nAND ANOTHER');
			}, false, { multiline: false });
		});
		suite('.typos', function() {
			suite('Styleguide', function() {
				common.testSection('Misspelt Styleguide 1', 'options-typos.less', function(section) {
					assert.ok(section);
					assert.equal(section.data.header, 'Misspelt Styleguide 1');
					assert.equal(section.data.reference, '5.1');
				}, 'Stileguide', { typos: true });

				common.testSection('Misspelt Styleguide 2', 'options-typos.less', function(section) {
					assert.ok(section);
					assert.equal(section.data.header, 'Misspelt Styleguide 2');
					assert.equal(section.data.reference, '5.2');
				}, 'Style-guide', { typos: true });

				common.testSection('Misspelt Styleguide 3', 'options-typos.less', function(section) {
					assert.ok(section);
					assert.equal(section.data.header, 'Misspelt Styleguide 3');
					assert.equal(section.data.reference, '5.3');
				}, 'Stylleguide', { typos: true });

				common.testSection('Misspelt Styleguide 4', 'options-typos.less', function(section) {
					assert.ok(section);
					assert.equal(section.data.reference, '5.4');
					assert.equal(section.data.header, 'Misspelt Styleguide 4');
				}, 'Style guide', { typos: true });
			});

			suite('Experimental', function() {
				common.testSection('Experimental: In Header', 'sections-status.less', function(section) {
					assert.ok(section.data.experimental);
				}, 'Correct spelling', { typos: true});

				common.testSection('Not at the beginning, experimental: nope', 'sections-status.less', function(section) {
					assert.ok(!section.data.experimental);
				}, 'Still don\'t detect mid-line', { typos: true });

				common.testSection('Experimentel: Misspelling 1', 'options-typos.less', function(section) {
					assert.ok(section.data.experimental);
				}, 'Experimentel', { typos: true});
			});

			suite('Deprecated', function() {
				common.testSection('Deprecated: In Header', 'sections-status.less', function(section) {
					assert.ok(section.data.deprecated);
				}, 'Correct spelling', { typos: true});

				common.testSection('Not at the beginning, deprecated: nope', 'sections-status.less', function(section) {
					assert.ok(!section.data.deprecated);
				}, 'Still don\'t detect mid-line', { typos: true });

				common.testSection('Depricated: Misspelling 1', 'options-typos.less', function(section) {
					assert.ok(section.data.deprecated);
				}, 'Depricated', { typos: true});
			});
		});
	});
});