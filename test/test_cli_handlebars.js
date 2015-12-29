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
      expect(err).to.not.exist;
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
      expect(this.files.index).to.include('Handlerbars helper loaded into template!');
      done();
    });
  });

  describe('default Handlebars helpers', function() {
    it('should load Handlerbars helper: {{section [arg]}}', function(done) {
      expect(this.files['section-3']).to.include('Handlebars Section Helper Test 3');
      expect(this.files['section-3']).to.include('Section 3 has been successfully loaded.');
      done();
    });

    it('should load Handlerbars helper: {{eachSection [arg]}}', function(done) {
      expect(this.files['section-2']).to.include('Handlebars eachSection Helper Test 2.1.3');
      expect(this.files['section-2']).to.include('Handlebars eachSection Helper Test 2.1.4');
      done();
    });

    it('should load Handlerbars helper: {{eachRoot}}', function(done) {
      expect(this.files.index).to.include('Handlebars eachRoot Helper Test 2');
      expect(this.files.index).to.include('Handlebars eachRoot Helper Test 3');
      expect(this.files.index).to.not.include('Handlebars eachRoot Helper Test 2.1.3');
      done();
    });

    it('should load Handlerbars helper: {{ifDepth [arg]}}', function(done) {
      expect(this.files['section-2']).to.include('Handlebars ifDepth Helper Test 2.1<');
      expect(this.files['section-2']).to.not.include('Handlebars ifDepth Helper Test 2.1.3');
      done();
    });

    it('should load Handlerbars helper: {{unlessDepth [arg]}}', function(done) {
      expect(this.files['section-2']).to.include('Handlebars unlessDepth Helper Test 2.1.3');
      expect(this.files['section-2']).to.not.include('Handlebars unlessDepth Helper Test 2.1<');
      done();
    });

    it('should load Handlerbars helper: {{eachModifier}}', function(done) {
      expect(this.files['section-2']).to.include('Handlebars eachModifier Helper: :hover');
      expect(this.files['section-2']).to.include('Handlebars eachModifier Helper: .stars-given<');
      expect(this.files['section-2']).to.include('Handlebars eachModifier Helper: .stars-given:hover');
      expect(this.files['section-2']).to.include('Handlebars eachModifier Helper: .disabled');
      done();
    });

    it('should load Handlerbars helper: {{{markup}}}', function(done) {
      expect(this.files['section-2']).to.include('Handlebars markup Helper: pseudo-class-hover');
      expect(this.files['section-2']).to.include('Handlebars markup Helper: stars-given<');
      expect(this.files['section-2']).to.include('Handlebars markup Helper: stars-given pseudo-class-hover');
      expect(this.files['section-2']).to.include('Handlebars markup Helper: disabled');
      expect(this.files['section-2']).to.include('Nested Handlerbars partial part 1:part 2 of Nested Handlerbars partial');
      expect(this.files['section-2']).to.include('Test of Handlerbars partial data');
      done();
    });
  });
});
