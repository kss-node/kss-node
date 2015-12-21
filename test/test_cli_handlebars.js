/* eslint-disable max-nested-callbacks,no-regex-spaces */

'use strict';

var cli = require('../lib/cli'),
  fs = require('fs'),
  mockStream = require('mock-utf8-stream'),
  path = require('path');

describe('Handlebars template', function() {
  before(function(done) {
    var self = this,
      files,
      fileReader,
      fileCounter,
      stdout = new mockStream.MockWritableStream(),
      stderr = new mockStream.MockWritableStream();

    self.files = {};
    stdout.startCapture();
    stderr.startCapture();

    cli({
      stdout: stdout,
      stderr: stderr,
      argv: ['node', 'bin/kss-node', 'test/fixtures/with-include', 'test/output/nested', '--template', 'test/fixtures/template', '--helpers', 'test/fixtures/template/helpers']
    }, function(err) {
      should.not.exist(err);
      self.stdout = stdout.capturedData;
      files = [
        'index',
        'section-2',
        'section-3'
      ];
      fileCounter = files.length;
      files.map(function(file) {
        fs.readFile(path.join(__dirname, 'output/nested', file + '.html'), 'utf8', fileReader(file));
      });
    });

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
      this.files.index.should.include('Handlerbars helper loaded into template!');
      done();
    });
  });

  describe('default Handlebars helpers', function() {
    it('should load Handlerbars helper: {{section [arg]}}', function(done) {
      this.files['section-3'].should.include('Handlebars Section Helper Test 3');
      this.files['section-3'].should.include('Section 3 has been successfully loaded.');
      done();
    });

    it('should load Handlerbars helper: {{eachSection [arg]}}', function(done) {
      this.files['section-2'].should.include('Handlebars eachSection Helper Test 2.1.3');
      this.files['section-2'].should.include('Handlebars eachSection Helper Test 2.1.4');
      done();
    });

    it('should load Handlerbars helper: {{eachRoot}}', function(done) {
      this.files.index.should.include('Handlebars eachRoot Helper Test 2');
      this.files.index.should.include('Handlebars eachRoot Helper Test 3');
      this.files.index.should.not.include('Handlebars eachRoot Helper Test 2.1.3');
      done();
    });

    it('should load Handlerbars helper: {{ifDepth [arg]}}', function(done) {
      this.files['section-2'].should.include('Handlebars ifDepth Helper Test 2.1<');
      this.files['section-2'].should.not.include('Handlebars ifDepth Helper Test 2.1.3');
      done();
    });

    it('should load Handlerbars helper: {{unlessDepth [arg]}}', function(done) {
      this.files['section-2'].should.include('Handlebars unlessDepth Helper Test 2.1.3');
      this.files['section-2'].should.not.include('Handlebars unlessDepth Helper Test 2.1<');
      done();
    });

    it('should load Handlerbars helper: {{eachModifier}}', function(done) {
      this.files['section-2'].should.include('Handlebars eachModifier Helper: :hover');
      this.files['section-2'].should.include('Handlebars eachModifier Helper: .stars-given<');
      this.files['section-2'].should.include('Handlebars eachModifier Helper: .stars-given:hover');
      this.files['section-2'].should.include('Handlebars eachModifier Helper: .disabled');
      done();
    });

    it('should load Handlerbars helper: {{{markup}}}', function(done) {
      this.files['section-2'].should.include('Handlebars markup Helper: pseudo-class-hover');
      this.files['section-2'].should.include('Handlebars markup Helper: stars-given<');
      this.files['section-2'].should.include('Handlebars markup Helper: stars-given pseudo-class-hover');
      this.files['section-2'].should.include('Handlebars markup Helper: disabled');
      this.files['section-2'].should.include('Nested Handlerbars partial part 1:part 2 of Nested Handlerbars partial');
      this.files['section-2'].should.include('Test of Handlerbars partial data');
      done();
    });
  });
});
