/*global describe,context,it,before,Buffer*/
/*eslint-disable max-nested-callbacks*/

'use strict';

var kss = require('../index.js'),
  testUtils = require('./testUtils'),
  fs = require('fs'),
  marked = require('marked'),
  /*eslint-disable no-unused-vars*/
  // path will load the Buffer class.
  path = require('path');
  /*eslint-enable no-unused-vars*/

describe('kss.traverse()', function() {
  describe('API validation checks', function() {
    it('should function without options', function(done) {
      kss.traverse(testUtils.fixtures(), function(err, styleguide) {
        err.should.not.be.Error();
        styleguide.data.files.length.should.equal(23);
        done();
      });
    });

    it('should function with options', function(done) {
      kss.traverse(testUtils.fixtures(), {}, function(err, styleguide) {
        err.should.not.be.Error();
        styleguide.data.files.length.should.equal(23);
        done();
      });
    });

    it('should function with an array of directories given', function(done) {
      kss.traverse([testUtils.fixtures('with-include'), testUtils.fixtures('missing-homepage')], {}, function(err, styleguide) {
        err.should.not.be.Error();
        styleguide.data.files.length.should.equal(2);
        done();
      });
    });

    it('should throw an error without a callback', function(done) {
      (function() {kss.traverse(testUtils.fixtures()); }).should.throw();
      done();
    });
  });

  describe('given different comment syntax:', function() {
    before(function(done) {
      var self = this;
      testUtils.traverseFixtures({mask: 'sections-comment-syntax.less'}, function(styleguide) {
        self.styleguide = styleguide;
        done();
      });
    });

    it('should parse /* */ CSS comments', function(done) {
      this.styleguide.section('comment.multi-line').header().should.equal('Comment syntax: multi-line');
      done();
    });

    it('should parse // CSS Preprocessor comments', function(done) {
      this.styleguide.section('comment.inline').header().should.equal('Comment syntax: inline');
      done();
    });

    it('should parse indented /* */ CSS comments', function(done) {
      this.styleguide.section('comment.multi-line.indented').header().should.equal('Comment syntax: multi-line, indented');
      done();
    });

    it('should not parse a /* inside a CSS string', function(done) {
      this.styleguide.section('comment.multi-line.false-positive.test-1').header().should.equal('False-positive of multi-line comment block #1');
      done();
    });

    it('should not parse a single line /* */ CSS comment', function(done) {
      this.styleguide.section('comment.multi-line.false-positive.test-2').header().should.equal('False-positive of multi-line comment block #2');
      done();
    });

    it('should parse a //-style block directly before a /**/-style block', function(done) {
      this.styleguide.section('comment.inline.no-bottom-space').header().should.equal('Comment syntax: inline, directly before multi-line');
      done();
    });

    it('should parse a /**/-style block directly after a //-style block', function(done) {
      this.styleguide.section('comment.multi-line.no-top-space').header().should.equal('Comment syntax: multi-line, directly after inline');
      done();
    });

    it('should parse a Docblock-style block', function(done) {
      this.styleguide.section('comment.docblock').header().should.equal('Docblock comment syntax');
      done();
    });
  });

  context('returns styleguide.data', function() {
    describe('.files:', function() {
      it('should reflect files found', function(done) {
        testUtils.traverseFixtures({mask: /.*/g}, function(styleguide) {
          styleguide.data.should.be.an.Object();
          styleguide.data.files.should.be.an.Array();
          styleguide.data.files.length.should.equal(31);
          done();
        });
      });
    });

    describe('.body:', function() {
      it('should be a string', function(done) {
        testUtils.traverseFixtures({}, function(styleguide) {
          styleguide.data.body.should.not.be.instanceof(Buffer);
          styleguide.data.body.should.be.String();
          done();
        });
      });

      it('contains contents of all found files', function(done) {
        var fileReader, fileCounter, sg;

        testUtils.traverseFixtures({}, function(styleguide) {
          sg = styleguide;
          fileCounter = styleguide.data.files.length;
          styleguide.data.files.map(function(file) {
            fs.readFile(file, 'utf8', fileReader);
          });
        });

        fileReader = function(err, data) {
          if (err) {
            throw err;
          }

          sg.data.body.should.containEql(data);
          fileCounter -= 1;
          if (!fileCounter) {
            done();
          }
        };
      });
    });

    describe('.sections[]:', function() {
      describe('.raw', function() {
        before(function(done) {
          var self = this;
          testUtils.traverseFixtures({}, function(styleguide) {
            self.styleguide = styleguide;
            done();
          });
        });

        it('should contain an array of comment blocks that are from .data.body (disregarding whitespace and asterisks)', function() {
          var data = this.styleguide.data,
            filteredBody = data.body.replace(/\/\/|\/\*+|\*\/|\s|\*/g, '');

          data.sections.map(function(section) {
            filteredBody.should.containEql(section.data.raw.replace(/\s|\*/g, ''));
          });
        });
      });

      describe('.header / .description', function() {
        before(function(done) {
          var self = this;
          testUtils.traverseFixtures({mask: 'property-header.less', markdown: false}, function(styleguide) {
            self.styleguide = styleguide;
            done();
          });
        });

        it('should find a one line header, no description or modifiers', function(done) {
          var section = this.styleguide.section('header.one-line.no-modifiers');
          section.data.header.should.equal('ONE LINE, NO MODIFIERS');
          section.data.description.should.equal('');
          done();
        });

        it('should find a one line header, multiple modifiers', function(done) {
          var section = this.styleguide.section('header.one-line.multiple-modifiers');
          section.data.header.should.equal('ONE LINE, MULTIPLE MODIFIERS');
          section.data.description.should.equal('');
          done();
        });

        it('should find a header, description and multiple modifiers', function(done) {
          var section = this.styleguide.section('header.description');
          section.data.header.should.equal('HEADER DETECTION');
          section.data.description.should.equal('SEPARATE PARAGRAPH');
          section.data.modifiers.length.should.equal(2);
          done();
        });

        it('should find a two-line header, multiple modifiers and no description', function(done) {
          var section = this.styleguide.section('header.two-lines');
          section.data.header.should.equal('TWO LINES, MULTIPLE MODIFIERS LIKE SO');
          section.data.description.should.equal('');
          done();
        });

        it('should find a header, 3-paragraph description and no modifiers', function(done) {
          var section = this.styleguide.section('header.three-paragraphs');
          section.data.header.should.equal('THREE PARAGRAPHS, NO MODIFIERS');
          section.data.description.should.equal('ANOTHER PARAGRAPH\n\nAND ANOTHER');
          done();
        });
      });

      describe('.modifiers', function() {
        before(function(done) {
          var self = this;
          testUtils.traverseFixtures({mask: 'property-modifiers.less', markdown: false}, function(styleguide) {
            self.styleguide = styleguide;
            done();
          });
        });

        it('should find no modifiers', function(done) {
          var modifiers = this.styleguide.section('no-modifiers').modifiers();
          modifiers.length.should.equal(0);
          done();
        });

        it('should find modifiers with a single white space', function(done) {
          var modifiers = this.styleguide.section('modifiers.single-white-space').modifiers();
          modifiers.length.should.equal(2);
          modifiers[0].data.name.should.equal(':hover');
          modifiers[0].data.description.should.equal('HOVER');
          modifiers[1].data.name.should.equal(':disabled');
          modifiers[1].data.description.should.equal('DISABLED');
          done();
        });

        it('should find modifiers with variable white space', function(done) {
          var modifiers = this.styleguide.section('modifiers.variable-white-space').modifiers();
          modifiers.length.should.equal(4);
          modifiers[0].data.name.should.equal(':hover');
          modifiers[0].data.description.should.equal('HOVER');
          modifiers[1].data.name.should.equal(':disabled');
          modifiers[1].data.description.should.equal('DISABLED');
          modifiers[2].data.name.should.equal(':focus');
          modifiers[2].data.description.should.equal('INCLUDING MULTIPLE LINES');
          modifiers[3].data.name.should.equal(':link');
          modifiers[3].data.description.should.equal('WITH TABS');
          done();
        });

        it('should find modifiers with CSS classes', function(done) {
          var modifiers = this.styleguide.section('modifiers.classes').modifiers();
          modifiers.length.should.equal(3);
          modifiers[0].data.name.should.equal('.red');
          modifiers[0].data.description.should.equal('MAKE IT RED');
          modifiers[1].data.name.should.equal('.yellow');
          modifiers[1].data.description.should.equal('MAKE IT YELLOW');
          modifiers[2].data.name.should.equal('.red.yellow');
          modifiers[2].data.description.should.equal('MAKE IT ORANGE');
          done();
        });

        it('should find modifiers with CSS classes containing dashes', function(done) {
          var modifiers = this.styleguide.section('modifiers.dashes-in-classes').modifiers();
          modifiers.length.should.equal(3);
          modifiers[0].data.name.should.equal('.red');
          modifiers[0].data.description.should.equal('MAKE IT RED');
          modifiers[1].data.name.should.equal('.yellow');
          modifiers[1].data.description.should.equal('MAKE IT YELLOW');
          modifiers[2].data.name.should.equal('.red-yellow');
          modifiers[2].data.description.should.equal('MAKE IT ORANGE');
          done();
        });

        it('should find modifiers with HTML elements', function(done) {
          var modifiers = this.styleguide.section('modifiers.elements').modifiers();
          modifiers.length.should.equal(3);
          modifiers[0].data.name.should.equal('a');
          modifiers[0].data.description.should.equal('Contains the image replacement');
          modifiers[1].data.name.should.equal('span');
          modifiers[1].data.description.should.equal('Hidden');
          modifiers[2].data.name.should.equal('a span');
          modifiers[2].data.description.should.equal('Two elements');
          done();
        });

        it('should find modifiers with mixed classes and elements', function(done) {
          var modifiers = this.styleguide.section('modifiers.classes-elements').modifiers();
          modifiers.length.should.equal(5);
          done();
        });

        it('should find modifiers with more than one dash', function(done) {
          var modifiers = this.styleguide.section('modifiers.multiple-dashes').modifiers();
          modifiers.length.should.equal(3);
          modifiers[0].data.name.should.equal('.red');
          modifiers[0].data.description.should.equal('Color - red');
          modifiers[1].data.name.should.equal('.yellow');
          modifiers[1].data.description.should.equal('Color  -  yellow');
          modifiers[2].data.name.should.equal('.blue');
          modifiers[2].data.description.should.equal('Color - blue  -  another dash');
          done();
        });

        it('should find modifiers after description', function(done) {
          var modifiers = this.styleguide.section('modifiers.after-description').modifiers();
          modifiers.length.should.equal(2);
          done();
        });

        describe('.data.className', function() {
          it('should convert pseudo-class to KSS-style .pseudo-class-[name]', function(done) {
            testUtils.traverseFixtures({mask: '*.less|*.css'}, function(styleguide) {
              styleguide.data.sections.map(function(section) {
                section.data.modifiers.map(function(modifier) {
                  modifier.data.name.replace(/\:/g, '.pseudo-class-').should.equal(modifier.data.className);
                });
              });
              done();
            });
          });
        });
      });

      describe('.deprecated/.experimental', function() {
        before(function(done) {
          var self = this;
          testUtils.traverseFixtures({mask: 'property-deprecated-experimental.less', markdown: false, multiline: true}, function(styleguide) {
            self.styleguide = styleguide;
            done();
          });
        });

        it('should find with space above and below', function(done) {
          this.styleguide.section('deprecated.spacing').data.deprecated.should.be.true();
          this.styleguide.section('experimental.spacing').data.experimental.should.be.true();
          done();
        });

        it('should find indented', function(done) {
          this.styleguide.section('deprecated.indented').data.deprecated.should.be.true();
          this.styleguide.section('experimental.indented').data.experimental.should.be.true();
          done();
        });

        it('should find in header', function(done) {
          this.styleguide.section('deprecated.in-header').data.deprecated.should.be.true();
          this.styleguide.section('experimental.in-header').data.experimental.should.be.true();
          done();
        });

        it('should find in description', function(done) {
          this.styleguide.section('deprecated.in-paragraph').data.deprecated.should.be.true();
          this.styleguide.section('experimental.in-paragraph').data.experimental.should.be.true();
          done();
        });

        it('should not find in modifiers', function(done) {
          this.styleguide.section('deprecated.in-modifier').data.deprecated.should.be.false();
          this.styleguide.section('experimental.in-modifier').data.experimental.should.be.false();
          done();
        });

        it('should not find when not at the beginning of a line', function(done) {
          this.styleguide.section('deprecated.not-at-beginning').data.deprecated.should.be.false();
          this.styleguide.section('experimental.not-at-beginning').data.experimental.should.be.false();
          done();
        });
      });

      describe('.reference', function() {
        it('should find reference "X.0" without trailing zero', function(done) {
          testUtils.traverseFixtures({mask: 'sections-queries.less', multiline: true}, function(styleguide) {
            styleguide.section(/8.*/)[0].data.reference.should.equal('8');
            done();
          });
        });
      });
    });
  });

  context('given options', function() {
    describe('.custom', function() {
      before(function(done) {
        var self = this;
        testUtils.traverseFixtures({
          mask: 'options-custom.less',
          markdown: false,
          custom: ['custom', 'custom property', 'custom2']
        }, function(styleguide) {
          self.styleguide = styleguide;
          done();
        });
      });

      it('should find an inline value', function(done) {
        this.styleguide.section('custom.inline').data.custom.should.equal('The value of this property is inline.');
        done();
      });

      it('should find a value on the next line', function(done) {
        this.styleguide.section('custom.value.next-line').data.custom.should.equal('The value of this property is on the next line.');
        done();
      });

      it('should find a multi-line value', function(done) {
        this.styleguide.section('custom.value.multi-line').data.custom.should.equal('The value of this property spans multiple\nlines.');
        done();
      });

      it('should find a multi-word property', function(done) {
        this.styleguide.section('custom.multi-word').data['custom property'].should.equal('This is a multi-word property.');
        done();
      });

      it('should find multiple properties', function(done) {
        this.styleguide.section('custom.multi').data.custom.should.equal('This is the first property.');
        this.styleguide.section('custom.multi').data.custom2.should.equal('This is the second property.');
        done();
      });
    });

    describe('.markup', function() {
      before(function(done) {
        var self = this;
        testUtils.traverseFixtures({mask: 'property-markup.less', markdown: false}, function(styleguide) {
          self.styleguide = styleguide;
          done();
        });
      });

      it('should find markup property', function(done) {
        var section = this.styleguide.section('markup.second-paragraph');
        section.data.markup.should.equal('<a href="#" class="{{modifier_class}}">Hello World</a>');
        section.data.description.should.equal('');
        section.data.modifiers.length.should.equal(3);
        done();
      });

      it('should find markup property below modifiers', function(done) {
        var section = this.styleguide.section('markup.below-modifiers');
        section.data.markup.should.equal('<a href="#" class="{{modifier_class}}">Lorem Ipsum</a>');
        section.data.modifiers.length.should.equal(1);
        done();
      });

      it('should not interfere with content when at the top', function(done) {
        var section = this.styleguide.section('markup.at-top');
        section.data.header.should.equal('Don\'t be the header');
        section.data.markup.should.equal('<h1 class="{{modifier_class}}">Header</h1>');
        section.data.modifiers[0].data.name.should.equal('.title');
        done();
      });
    });

    describe('.mask:', function() {
      describe('default mask', function() {
        before(function(done) {
          var self = this;
          testUtils.traverseFixtures({}, function(styleguide) {
            self.styleguide = styleguide;
            done();
          });
        });

        it('should find file file-type.css', function(done) {
          this.styleguide.should.containFile('file-type.css');
          done();
        });
        it('should find file file-type.less', function(done) {
          this.styleguide.should.containFile('file-type.less');
          done();
        });
        it('should find file file-type.stylus', function(done) {
          this.styleguide.should.containFile('file-type.stylus');
          done();
        });
        it('should find file file-type.styl', function(done) {
          this.styleguide.should.containFile('file-type.styl');
          done();
        });
        it('should find file file-type.sass', function(done) {
          this.styleguide.should.containFile('file-type.sass');
          done();
        });
        it('should find file file-type.scss', function(done) {
          this.styleguide.should.containFile('file-type.scss');
          done();
        });
        it('should find file includes/buttons.less', function(done) {
          this.styleguide.should.containFile('includes/buttons.less');
          done();
        });
        it('should find not file includes/buttons.js', function(done) {
          this.styleguide.should.not.containFile('includes/buttons.js');
          done();
        });
      });

      describe('/\\.js/ (regex)', function() {
        before(function(done) {
          var self = this;
          testUtils.traverseFixtures({mask: /\.js/}, function(styleguide) {
            self.styleguide = styleguide;
            done();
          });
        });

        it('should find file includes/buttons.js', function(done) {
          this.styleguide.should.containFile('includes/buttons.js');
          done();
        });
        it('should find file includes/buttons.less', function(done) {
          this.styleguide.should.not.containFile('includes/buttons.less');
          done();
        });
        it('should find file style.css', function(done) {
          this.styleguide.should.not.containFile('file-type.css');
          done();
        });
      });

      describe("'*.js' (string)", function() {
        before(function(done) {
          var self = this;
          testUtils.traverseFixtures({mask: '*.js'}, function(styleguide) {
            self.styleguide = styleguide;
            done();
          });
        });

        it('should find file includes/buttons.js', function(done) {
          this.styleguide.should.containFile('includes/buttons.js');
          done();
        });
        it('should find file includes/buttons.less', function(done) {
          this.styleguide.should.not.containFile('includes/buttons.less');
          done();
        });
        it('should find file style.css', function(done) {
          this.styleguide.should.not.containFile('file-type.css');
          done();
        });
      });

      describe('/\.js|\.less|\.css/ (regex)', function() {
        before(function(done) {
          var self = this;
          testUtils.traverseFixtures({mask: /\.js|\.less|\.css/}, function(styleguide) {
            self.styleguide = styleguide;
            done();
          });
        });

        it('should find file includes/buttons.js', function(done) {
          this.styleguide.should.containFile('includes/buttons.js');
          done();
        });
        it('should find file includes/buttons.less', function(done) {
          this.styleguide.should.containFile('includes/buttons.less');
          done();
        });
        it('should find file style.css', function(done) {
          this.styleguide.should.containFile('file-type.css');
          done();
        });
      });

      describe("'*.js|*.less|*.css' (string)", function() {
        before(function(done) {
          var self = this;
          testUtils.traverseFixtures({mask: '*.js|*.less|*.css'}, function(styleguide) {
            self.styleguide = styleguide;
            done();
          });
        });

        it('should find file includes/buttons.js', function(done) {
          this.styleguide.should.containFile('includes/buttons.js');
          done();
        });
        it('should find file includes/buttons.less', function(done) {
          this.styleguide.should.containFile('includes/buttons.less');
          done();
        });
        it('should find file style.css', function(done) {
          this.styleguide.should.containFile('file-type.css');
          done();
        });
      });
    });

    describe('.markdown:', function() {
      it('should be enabled by default', function(done) {
        testUtils.traverseFixtures({mask: 'property-header.less'}, function(styleguide) {
          styleguide.section('header.three-paragraphs').data.description.should.equal(marked('ANOTHER PARAGRAPH\n\nAND ANOTHER'));
          done();
        });
      });
      it('should not add HTML when disabled', function(done) {
        testUtils.traverseFixtures({mask: 'property-header.less', markdown: false}, function(styleguide) {
          styleguide.section('header.three-paragraphs').data.description.should.equal('ANOTHER PARAGRAPH\n\nAND ANOTHER');
          done();
        });
      });
    });

    describe('.multiline:', function() {
      it('should be enabled by default', function(done) {
        testUtils.traverseFixtures({mask: 'property-header.less', markdown: false}, function(styleguide) {
          styleguide.section('header.three-paragraphs').data.description.should.equal('ANOTHER PARAGRAPH\n\nAND ANOTHER');
          done();
        });
      });

      it('should not remove the header from description when disabled', function(done) {
        testUtils.traverseFixtures({mask: 'property-header.less', markdown: false, multiline: false}, function(styleguide) {
          styleguide.section('header.three-paragraphs').data.description.should.equal('THREE PARAGRAPHS, NO MODIFIERS\n\nANOTHER PARAGRAPH\n\nAND ANOTHER');
          done();
        });
      });
    });

    describe('.typos:', function() {
      before(function(done) {
        var self = this;
        testUtils.traverseFixtures({mask: 'options-typos.less', typos: true}, function(styleguide) {
          self.styleguide = styleguide;
          testUtils.traverseFixtures({mask: 'property-deprecated-experimental.less', typos: true}, function(styleguide2) {
            self.styleguide2 = styleguide2;
          });
          done();
        });
      });

      describe('Misspelt style guide', function() {
        it('should find "Stileguide"', function(done) {
          this.styleguide.section('typos.stileguide').data.header.should.equal('Misspelt style guide 1');
          done();
        });

        it('should find "Style-guide"', function(done) {
          this.styleguide.section('typos.style-guide').data.header.should.equal('Misspelt style guide 2');
          done();
        });

        it('should find "Stylleguide"', function(done) {
          this.styleguide.section('typos.stylleguide').data.header.should.equal('Misspelt style guide 3');
          done();
        });

        it('should, but doesn\'t, find "Styelguide"', function(done) {
          this.styleguide.section('typos.styelguide').should.be.false();
          done();
        });

        it('should find "Style guide" amid word phrases', function(done) {
          this.styleguide.section('typos - word - phrases').data.header.should.equal('Misspelt style guide 5');
          done();
        });
      });

      describe('Misspelt experimental', function() {
        it('should find correct spelling', function(done) {
          this.styleguide2.section('experimental.in-paragraph').data.experimental.should.be.true();
          done();
        });

        it('should still not find when not at the beginning of a line', function(done) {
          this.styleguide2.section('experimental.not-at-beginning').data.experimental.should.be.false();
          done();
        });

        it('should find "experimentel"', function(done) {
          this.styleguide.section('typos.experimentel').data.experimental.should.be.true();
          done();
        });
      });

      describe('Misspelt deprecated', function() {
        it('should find correct spelling', function(done) {
          this.styleguide2.section('deprecated.in-paragraph').data.deprecated.should.be.true();
          done();
        });

        it('should still not find when not at the beginning of a line', function(done) {
          this.styleguide2.section('deprecated.not-at-beginning').data.deprecated.should.be.false();
          done();
        });

        it('should find "depricated"', function(done) {
          this.styleguide.section('typos.depricated').data.deprecated.should.be.true();
          done();
        });
      });
    });
  });
});
