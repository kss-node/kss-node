/* global Buffer */
/* eslint-disable max-nested-callbacks */

'use strict';

var fs = require('fs'),
  marked = require('marked');

describe('kss.parse()', function() {
  before(function(done) {
    this.files = {
      '/tmp/example1': 'file contents',
      '/tmp/example2': 'file contents',
      '/tmp/example3': '// Style guide: all-by-itself',
      '/tmp/example4': '// Invalid weight\n//\n// Weight: invalid\n//\n// Style guide: invalid-weight'
    };
    done();
  });

  describe('API validation checks', function() {
    it('should function with no options', function(done) {
      kss.parse(this.files, {}, function(error, styleguide) {
        expect(error).to.not.exist;
        expect(styleguide.meta.files.length).to.equal(4);
        done();
      });
    });

    it('should function when given a string', function(done) {
      kss.parse('file contents', {}, function(error, styleguide) {
        expect(error).to.not.exist;
        expect(styleguide.data).to.not.have.property('files');
        done();
      });
    });
  });

  describe('given different comment syntax:', function() {
    before(function(done) {
      var self = this;
      helperUtils.traverseFixtures({mask: 'sections-comment-syntax.less'}, function(styleguide) {
        self.styleguide = styleguide;
        done();
      });
    });

    it('should parse /* */ CSS comments', function(done) {
      expect(this.styleguide.section('comment.multi-line').header()).to.equal('Comment syntax: multi-line');
      done();
    });

    it('should parse // CSS Preprocessor comments', function(done) {
      expect(this.styleguide.section('comment.inline').header()).to.equal('Comment syntax: inline');
      done();
    });

    it('should parse indented /* */ CSS comments', function(done) {
      expect(this.styleguide.section('comment.multi-line.indented').header()).to.equal('Comment syntax: multi-line, indented');
      done();
    });

    it('should not parse a /* inside a CSS string', function(done) {
      expect(this.styleguide.section('comment.multi-line.false-positive.test-1').header()).to.equal('False-positive of multi-line comment block #1');
      done();
    });

    it('should not parse a single line /* */ CSS comment', function(done) {
      expect(this.styleguide.section('comment.multi-line.false-positive.test-2').header()).to.equal('False-positive of multi-line comment block #2');
      done();
    });

    it('should parse a //-style block directly before a /**/-style block', function(done) {
      expect(this.styleguide.section('comment.inline.no-bottom-space').header()).to.equal('Comment syntax: inline, directly before multi-line');
      done();
    });

    it('should parse a /**/-style block directly after a //-style block', function(done) {
      expect(this.styleguide.section('comment.multi-line.no-top-space').header()).to.equal('Comment syntax: multi-line, directly after inline');
      done();
    });

    it('should parse a Docblock-style block', function(done) {
      expect(this.styleguide.section('comment.docblock').header()).to.equal('Docblock comment syntax');
      done();
    });
  });

  context('returns styleguide', function() {
    describe('.meta.files:', function() {
      it('should reflect files found', function(done) {
        helperUtils.traverseFixtures({mask: /.*/g}, function(styleguide) {
          expect(styleguide.data).to.be.an.instanceOf(Object);
          expect(styleguide.meta.files).to.be.an.instanceOf(Array);
          expect(styleguide.meta.files.length).to.equal(31);
          done();
        });
      });
    });

    describe('.sections():', function() {
      describe('.raw', function() {
        before(function(done) {
          var self = this,
            fileCounter;

          helperUtils.traverseFixtures({}, function(styleguide) {
            self.styleguide = styleguide;
            self.fileContents = '';
            fileCounter = styleguide.meta.files.length;
            styleguide.meta.files.map(function(file) {
              fs.readFile(file, 'utf8', function(error, data) {
                if (error) {
                  throw error;
                }

                self.fileContents += data;
                fileCounter -= 1;
                if (!fileCounter) {
                  done();
                }
              });
            });
          });
        });

        it('should contain a copy of comment blocks that are from the original files (disregarding whitespace and asterisks)', function() {
          var filteredFileText = this.fileContents.replace(/\/\/|\/\*+|\*\/|\s|\*/g, '');

          this.styleguide.section().map(function(section) {
            expect(filteredFileText).to.include(section.meta.raw.replace(/\s|\*/g, ''));
          });
        });
      });

      describe('.header / .description', function() {
        before(function(done) {
          var self = this;
          helperUtils.traverseFixtures({mask: 'property-header.less', markdown: false}, function(styleguide) {
            self.styleguide = styleguide;
            done();
          });
        });

        it('should find a one line header, no description or modifiers', function(done) {
          var section = this.styleguide.section('header.one-line.no-modifiers');
          expect(section.header()).to.equal('ONE LINE, NO MODIFIERS');
          expect(section.description()).to.equal('');
          done();
        });

        it('should find a one line header, multiple modifiers', function(done) {
          var section = this.styleguide.section('header.one-line.multiple-modifiers');
          expect(section.header()).to.equal('ONE LINE, MULTIPLE MODIFIERS');
          expect(section.description()).to.equal('');
          done();
        });

        it('should find a header, description and multiple modifiers', function(done) {
          var section = this.styleguide.section('header.description');
          expect(section.header()).to.equal('HEADER DETECTION');
          expect(section.description()).to.equal('SEPARATE PARAGRAPH');
          expect(section.modifiers().length).to.equal(2);
          done();
        });

        it('should find a two-line header, multiple modifiers and no description', function(done) {
          var section = this.styleguide.section('header.two-lines');
          expect(section.header()).to.equal('TWO LINES, MULTIPLE MODIFIERS LIKE SO');
          expect(section.description()).to.equal('');
          done();
        });

        it('should find a header, 3-paragraph description and no modifiers', function(done) {
          var section = this.styleguide.section('header.three-paragraphs');
          expect(section.header()).to.equal('THREE PARAGRAPHS, NO MODIFIERS');
          expect(section.description()).to.equal('ANOTHER PARAGRAPH\n\nAND ANOTHER');
          done();
        });

        it('should do something, not sure what', function(done) {
          kss.parse(this.files, {}, function(error, styleguide) {
            expect(error).to.not.exist;
            expect(styleguide.section('all-by-itself').header()).to.be.string('');
          });
          done();
        });
      });

      describe('.modifiers', function() {
        before(function(done) {
          var self = this;
          helperUtils.traverseFixtures({mask: 'property-modifiers.less', markdown: false}, function(styleguide) {
            self.styleguide = styleguide;
            done();
          });
        });

        it('should find no modifiers', function(done) {
          var modifiers = this.styleguide.section('no-modifiers').modifiers();
          expect(modifiers.length).to.equal(0);
          done();
        });

        it('should find modifiers with a single white space', function(done) {
          var modifiers = this.styleguide.section('modifiers.single-white-space').modifiers();
          expect(modifiers.length).to.equal(2);
          expect(modifiers[0].name()).to.equal(':hover');
          expect(modifiers[0].description()).to.equal('HOVER');
          expect(modifiers[1].name()).to.equal(':disabled');
          expect(modifiers[1].description()).to.equal('DISABLED');
          done();
        });

        it('should find modifiers with variable white space', function(done) {
          var modifiers = this.styleguide.section('modifiers.variable-white-space').modifiers();
          expect(modifiers.length).to.equal(4);
          expect(modifiers[0].name()).to.equal(':hover');
          expect(modifiers[0].description()).to.equal('HOVER');
          expect(modifiers[1].name()).to.equal(':disabled');
          expect(modifiers[1].description()).to.equal('DISABLED');
          expect(modifiers[2].name()).to.equal(':focus');
          expect(modifiers[2].description()).to.equal('INCLUDING MULTIPLE LINES');
          expect(modifiers[3].name()).to.equal(':link');
          expect(modifiers[3].description()).to.equal('WITH TABS');
          done();
        });

        it('should find modifiers with CSS classes', function(done) {
          var modifiers = this.styleguide.section('modifiers.classes').modifiers();
          expect(modifiers.length).to.equal(3);
          expect(modifiers[0].name()).to.equal('.red');
          expect(modifiers[0].description()).to.equal('MAKE IT RED');
          expect(modifiers[1].name()).to.equal('.yellow');
          expect(modifiers[1].description()).to.equal('MAKE IT YELLOW');
          expect(modifiers[2].name()).to.equal('.red.yellow');
          expect(modifiers[2].description()).to.equal('MAKE IT ORANGE');
          done();
        });

        it('should find modifiers with CSS classes containing dashes', function(done) {
          var modifiers = this.styleguide.section('modifiers.dashes-in-classes').modifiers();
          expect(modifiers.length).to.equal(3);
          expect(modifiers[0].name()).to.equal('.red');
          expect(modifiers[0].description()).to.equal('MAKE IT RED');
          expect(modifiers[1].name()).to.equal('.yellow');
          expect(modifiers[1].description()).to.equal('MAKE IT YELLOW');
          expect(modifiers[2].name()).to.equal('.red-yellow');
          expect(modifiers[2].description()).to.equal('MAKE IT ORANGE');
          done();
        });

        it('should find modifiers with HTML elements', function(done) {
          var modifiers = this.styleguide.section('modifiers.elements').modifiers();
          expect(modifiers.length).to.equal(3);
          expect(modifiers[0].name()).to.equal('a');
          expect(modifiers[0].description()).to.equal('Contains the image replacement');
          expect(modifiers[1].name()).to.equal('span');
          expect(modifiers[1].description()).to.equal('Hidden');
          expect(modifiers[2].name()).to.equal('a span');
          expect(modifiers[2].description()).to.equal('Two elements');
          done();
        });

        it('should find modifiers with mixed classes and elements', function(done) {
          var modifiers = this.styleguide.section('modifiers.classes-elements').modifiers();
          expect(modifiers.length).to.equal(5);
          done();
        });

        it('should find modifiers with more than one dash', function(done) {
          var modifiers = this.styleguide.section('modifiers.multiple-dashes').modifiers();
          expect(modifiers.length).to.equal(3);
          expect(modifiers[0].name()).to.equal('.red');
          expect(modifiers[0].description()).to.equal('Color - red');
          expect(modifiers[1].name()).to.equal('.yellow');
          expect(modifiers[1].description()).to.equal('Color  -  yellow');
          expect(modifiers[2].name()).to.equal('.blue');
          expect(modifiers[2].description()).to.equal('Color - blue  -  another dash');
          done();
        });

        it('should find modifiers after description', function(done) {
          var modifiers = this.styleguide.section('modifiers.after-description').modifiers();
          expect(modifiers.length).to.equal(2);
          done();
        });
      });

      describe('.deprecated/.experimental', function() {
        before(function(done) {
          var self = this;
          helperUtils.traverseFixtures({mask: 'property-deprecated-experimental.less', markdown: false, header: true}, function(styleguide) {
            self.styleguide = styleguide;
            done();
          });
        });

        it('should find with space above and below', function(done) {
          expect(this.styleguide.section('deprecated.spacing').deprecated()).to.be.true;
          expect(this.styleguide.section('experimental.spacing').experimental()).to.be.true;
          done();
        });

        it('should find indented', function(done) {
          expect(this.styleguide.section('deprecated.indented').deprecated()).to.be.true;
          expect(this.styleguide.section('experimental.indented').experimental()).to.be.true;
          done();
        });

        it('should find in header', function(done) {
          expect(this.styleguide.section('deprecated.in-header').deprecated()).to.be.true;
          expect(this.styleguide.section('experimental.in-header').experimental()).to.be.true;
          done();
        });

        it('should find in description', function(done) {
          expect(this.styleguide.section('deprecated.in-paragraph').deprecated()).to.be.true;
          expect(this.styleguide.section('experimental.in-paragraph').experimental()).to.be.true;
          done();
        });

        it('should not find in modifiers', function(done) {
          expect(this.styleguide.section('deprecated.in-modifier').deprecated()).to.be.false;
          expect(this.styleguide.section('experimental.in-modifier').experimental()).to.be.false;
          done();
        });

        it('should not find when not at the beginning of a line', function(done) {
          expect(this.styleguide.section('deprecated.not-at-beginning').deprecated()).to.be.false;
          expect(this.styleguide.section('experimental.not-at-beginning').experimental()).to.be.false;
          done();
        });
      });

      describe('.reference', function() {
        it('should find reference "X.0" without trailing zero', function(done) {
          helperUtils.traverseFixtures({mask: 'sections-queries.less', header: true}, function(styleguide) {
            expect(styleguide.section(/8.*/)[0].reference()).to.equal('8');
            done();
          });
        });
      });

      describe('.weight', function() {
        it('should correct an invalid weight', function(done) {
          kss.parse(this.files, {}, function(error, styleguide) {
            expect(error).to.not.exist;
            expect(styleguide.section('invalid-weight').weight()).to.equal(0);
          });
          done();
        });
      });
    });
  });

  context('given options', function() {
    describe('.custom', function() {
      before(function(done) {
        var self = this;
        helperUtils.traverseFixtures({
          mask: 'options-custom.less',
          markdown: false,
          custom: ['custom', 'custom property', 'custom2']
        }, function(styleguide) {
          self.styleguide = styleguide;
          done();
        });
      });

      it('should find an inline value', function(done) {
        expect(this.styleguide.section('custom.inline').data.custom).to.equal('The value of this property is inline.');
        done();
      });

      it('should find a value on the next line', function(done) {
        expect(this.styleguide.section('custom.value.next-line').data.custom).to.equal('The value of this property is on the next line.');
        done();
      });

      it('should find a multi-line value', function(done) {
        expect(this.styleguide.section('custom.value.multi-line').data.custom).to.equal('The value of this property spans multiple\nlines.');
        done();
      });

      it('should find a multi-word property', function(done) {
        expect(this.styleguide.section('custom.multi-word').data['custom property']).to.equal('This is a multi-word property.');
        done();
      });

      it('should find multiple properties', function(done) {
        expect(this.styleguide.section('custom.multi').data.custom).to.equal('This is the first property.');
        expect(this.styleguide.section('custom.multi').data.custom2).to.equal('This is the second property.');
        done();
      });
    });

    describe('.markup', function() {
      before(function(done) {
        var self = this;
        helperUtils.traverseFixtures({mask: 'property-markup.less', markdown: false}, function(styleguide) {
          self.styleguide = styleguide;
          done();
        });
      });

      it('should find markup property', function(done) {
        var section = this.styleguide.section('markup.second-paragraph');
        expect(section.markup()).to.equal('<a href="#" class="{{modifier_class}}">Hello World</a>');
        expect(section.description()).to.equal('');
        expect(section.modifiers().length).to.equal(3);
        done();
      });

      it('should find markup property below modifiers', function(done) {
        var section = this.styleguide.section('markup.below-modifiers');
        expect(section.markup()).to.equal('<a href="#" class="{{modifier_class}}">Lorem Ipsum</a>');
        expect(section.modifiers().length).to.equal(1);
        done();
      });

      it('should not interfere with content when at the top', function(done) {
        var section = this.styleguide.section('markup.at-top');
        expect(section.header()).to.equal('Don\'t be the header');
        expect(section.markup()).to.equal('<h1 class="{{modifier_class}}">Header</h1>');
        expect(section.modifiers()[0].name()).to.equal('.title');
        done();
      });
    });

    describe('.markdown:', function() {
      it('should be enabled by default', function(done) {
        helperUtils.traverseFixtures({mask: 'property-header.less'}, function(styleguide) {
          expect(styleguide.section('header.three-paragraphs').description()).to.equal(marked('ANOTHER PARAGRAPH\n\nAND ANOTHER'));
          done();
        });
      });
      it('should not add HTML when disabled', function(done) {
        helperUtils.traverseFixtures({mask: 'property-header.less', markdown: false}, function(styleguide) {
          expect(styleguide.section('header.three-paragraphs').description()).to.equal('ANOTHER PARAGRAPH\n\nAND ANOTHER');
          done();
        });
      });
    });

    describe('.header:', function() {
      it('should be enabled by default', function(done) {
        helperUtils.traverseFixtures({mask: 'property-header.less', markdown: false}, function(styleguide) {
          expect(styleguide.section('header.three-paragraphs').description()).to.equal('ANOTHER PARAGRAPH\n\nAND ANOTHER');
          done();
        });
      });

      it('should not remove the header from description when disabled', function(done) {
        helperUtils.traverseFixtures({mask: 'property-header.less', markdown: false, header: false}, function(styleguide) {
          expect(styleguide.section('header.three-paragraphs').description()).to.equal('THREE PARAGRAPHS, NO MODIFIERS\n\nANOTHER PARAGRAPH\n\nAND ANOTHER');
          done();
        });
      });
    });

    describe('.typos:', function() {
      before(function(done) {
        var self = this;
        helperUtils.traverseFixtures({mask: 'options-typos.less', typos: true}, function(styleguide) {
          self.styleguide = styleguide;
          helperUtils.traverseFixtures({mask: 'property-deprecated-experimental.less', typos: true}, function(styleguide2) {
            self.styleguide2 = styleguide2;
          });
          done();
        });
      });

      describe('Misspelt style guide', function() {
        it('should find "Stileguide"', function(done) {
          expect(this.styleguide.section('typos.stileguide').header()).to.equal('Misspelt style guide 1');
          done();
        });

        it('should find "Style-guide"', function(done) {
          expect(this.styleguide.section('typos.style-guide').header()).to.equal('Misspelt style guide 2');
          done();
        });

        it('should find "Stylleguide"', function(done) {
          expect(this.styleguide.section('typos.stylleguide').header()).to.equal('Misspelt style guide 3');
          done();
        });

        it('should, but doesn\'t, find "Styelguide"', function(done) {
          expect(this.styleguide.section('typos.styelguide')).to.be.false;
          done();
        });

        it('should find "Style guide" amid word phrases', function(done) {
          expect(this.styleguide.section('typos - word - phrases').header()).to.equal('Misspelt style guide 5');
          done();
        });
      });

      describe('Misspelt experimental', function() {
        it('should find correct spelling', function(done) {
          expect(this.styleguide2.section('experimental.in-paragraph').experimental()).to.be.true;
          done();
        });

        it('should still not find when not at the beginning of a line', function(done) {
          expect(this.styleguide2.section('experimental.not-at-beginning').experimental()).to.be.false;
          done();
        });

        it('should find "experimentel"', function(done) {
          expect(this.styleguide.section('typos.experimentel').experimental()).to.be.true;
          done();
        });
      });

      describe('Misspelt deprecated', function() {
        it('should find correct spelling', function(done) {
          expect(this.styleguide2.section('deprecated.in-paragraph').deprecated()).to.be.true;
          done();
        });

        it('should still not find when not at the beginning of a line', function(done) {
          expect(this.styleguide2.section('deprecated.not-at-beginning').deprecated()).to.be.false;
          done();
        });

        it('should find "depricated"', function(done) {
          expect(this.styleguide.section('typos.depricated').deprecated()).to.be.true;
          done();
        });
      });
    });
  });
});
