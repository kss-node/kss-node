/*global describe,it,before*/
/*eslint-disable max-nested-callbacks,no-regex-spaces*/

'use strict';

var exec = require('child_process').exec,
  path = require('path'),
  fs = require('fs'),
  should = require('should');

describe('Handlebars template', function() {
  before(function(done) {
    var self = this,
      files,
      fileReader,
      fileCounter;

    self.files = {};

    exec(
      'bin/kss-node test/fixtures/with-include test/output/nested --template test/fixtures/template --helpers test/fixtures/template/helpers',
      function(err, stdout) {
        should.ifError(err);
        self.stdout = stdout;
        files = [
          'index',
          'section-2',
          'section-3'
        ];
        fileCounter = files.length;
        files.map(function(file) {
          fs.readFile(path.join(__dirname, 'output/nested', file + '.html'), 'utf8', fileReader(file));
        });
      }
    );

    // Create a closure with the file name stored.
    fileReader = function(fileName) {
      return function(err, data) {
        if (err) {
          throw err;
        }

        self.files[fileName] = data;
        fileCounter -= 1;
        if (!fileCounter) {
          done();
        }
      };
    };
  });

  describe('given --helpers option', function() {
    it('should load additional Handlerbars helpers', function(done) {
      this.stdout.should.containEql('The file containing the Handlebars helper was loaded.');
      this.files.index.should.containEql('Handlerbars helper loaded into template!');
      done();
    });
  });


  describe('default Handlebars helpers', function() {
    it('should load Handlerbars helper: {{section [arg]}}', function(done) {
      this.files['section-3'].should.containEql('Handlebars Section Helper Test 3');
      this.files['section-3'].should.containEql('Section 3 has been successfully loaded.');
      done();
    });
    it('should load Handlerbars helper: {{eachSection [arg]}}', function(done) {
      this.files['section-2'].should.containEql('Handlebars eachSection Helper Test 2.1.3');
      this.files['section-2'].should.containEql('Handlebars eachSection Helper Test 2.1.4');
      done();
    });
    it('should load Handlerbars helper: {{eachRoot}}', function(done) {
      this.files.index.should.containEql('Handlebars eachRoot Helper Test 2');
      this.files.index.should.containEql('Handlebars eachRoot Helper Test 3');
      this.files.index.should.not.containEql('Handlebars eachRoot Helper Test 2.1.3');
      done();
    });
    it('should load Handlerbars helper: {{ifDepth [arg]}}', function(done) {
      this.files['section-2'].should.containEql('Handlebars ifDepth Helper Test 2.1<');
      this.files['section-2'].should.not.containEql('Handlebars ifDepth Helper Test 2.1.3');
      done();
    });
    it('should load Handlerbars helper: {{unlessDepth [arg]}}', function(done) {
      this.files['section-2'].should.containEql('Handlebars unlessDepth Helper Test 2.1.3');
      this.files['section-2'].should.not.containEql('Handlebars unlessDepth Helper Test 2.1<');
      done();
    });
    it('should load Handlerbars helper: {{eachModifier}}', function(done) {
      this.files['section-2'].should.containEql('Handlebars eachModifier Helper: :hover');
      this.files['section-2'].should.containEql('Handlebars eachModifier Helper: .stars-given<');
      this.files['section-2'].should.containEql('Handlebars eachModifier Helper: .stars-given:hover');
      this.files['section-2'].should.containEql('Handlebars eachModifier Helper: .disabled');
      done();
    });
    it('should load Handlerbars helper: {{{markup}}}', function(done) {
      this.files['section-2'].should.containEql('Handlebars markup Helper: pseudo-class-hover');
      this.files['section-2'].should.containEql('Handlebars markup Helper: stars-given<');
      this.files['section-2'].should.containEql('Handlebars markup Helper: stars-given pseudo-class-hover');
      this.files['section-2'].should.containEql('Handlebars markup Helper: disabled');
      this.files['section-2'].should.containEql('Nested Handlerbars partial part 1:part 2 of Nested Handlerbars partial');
      this.files['section-2'].should.containEql('Test of Handlerbars partial data');
      done();
    });
  });
});
