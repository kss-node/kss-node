/* eslint-disable max-nested-callbacks,no-regex-spaces */

'use strict';

const cli = require('../lib/cli'),
  fs = require('fs'),
  mockStream = require('mock-utf8-stream'),
  path = require('path');

describe('Handlebars builder', function() {
  before(function(done) {
    let stdout = new mockStream.MockWritableStream(),
      stderr = new mockStream.MockWritableStream();

    stdout.startCapture();
    stderr.startCapture();

    // Create a closure with the file name stored.
    let fileCounter;
    this.files = {};
    let fileReader = fileName => {
      return (error, data) => {
        if (error) {
          throw error;
        }

        this.files[fileName] = data;
        fileCounter -= 1;
        if (!fileCounter) {
          done();
        }
      };
    };

    cli({
      stdout: stdout,
      stderr: stderr,
      argv: ['node', 'bin/kss-node', 'test/fixtures/with-include', 'test/output/nested', '--builder', 'test/fixtures/builder', '--helpers', 'test/fixtures/builder/helpers']
    }).catch(function(error) {
      // Pass the error on to the next .then().
      return error;
    }).then(result => {
      expect(result).to.not.be.instanceOf(Error);
      this.stdout = stdout.capturedData;
      let files = [
        'index',
        'section-2',
        'section-3'
      ];
      fileCounter = files.length;
      files.forEach(function(file) {
        fs.readFile(path.join(__dirname, 'output', 'nested', file + '.html'), 'utf8', fileReader(file));
      });
    });
  });

  describe('given --helpers option', function() {
    it('should load additional Handlerbars helpers', function(done) {
      expect(this.files.index).to.include('Handlerbars helper loaded into template!');
      done();
    });
  });

  describe('builder\'s Handlebars helpers', function() {
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

  describe('builder\'s Handlebars helpers', function() {
    it('should load Handlerbars helper: {{section [arg]}}', function(done) {
      expect(this.files['section-3']).to.include('Handlebars Section Helper Test 3');
      expect(this.files['section-3']).to.include('Section 3 has been successfully loaded.');
      done();
    });

    it('should load Handlerbars helper: {{eachSection [arg]}}', function(done) {
      expect(this.files['section-2']).to.include('Handlebars eachSection Helper Test 2.1.3');
      expect(this.files['section-2']).to.include('Handlebars eachSection Helper Test 2.1.4');
      expect(this.files['section-2']).to.include('Handlebars eachSection Helper: #each modifiers: :hover');
      expect(this.files['section-2']).to.include('Handlebars eachSection Helper: #each modifiers: .stars-given<');
      expect(this.files['section-2']).to.include('Handlebars eachSection Helper: #each modifiers: .stars-given:hover');
      expect(this.files['section-2']).to.include('Handlebars eachSection Helper: #each modifiers: .disabled');
      done();
    });
  });
});
