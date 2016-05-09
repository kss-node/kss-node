/* eslint-disable max-nested-callbacks,no-regex-spaces */

'use strict';

const cli = require('../lib/cli'),
  mockStream = require('mock-utf8-stream');

describe('KssBuilderHandlebars builder (default)', function() {
  before(function() {
    let stdout = new mockStream.MockWritableStream(),
      stderr = new mockStream.MockWritableStream();

    stdout.startCapture();
    stderr.startCapture();

    this.files = {};

    return cli({
      stdout: stdout,
      stderr: stderr,
      argv: ['node', 'bin/kss', 'test/fixtures/with-include', 'test/output/nested', '--builder', 'test/fixtures/builder']
    }).then(() => {
      this.stdout = stdout.capturedData;
      return Promise.all(
        [
          'section-2',
          'section-3'
        ].map(fileName => {
          return fs.readFileAsync(path.join(__dirname, 'output', 'nested', fileName + '.html'), 'utf8').then(data => {
            this.files[fileName] = data;
          });
        })
      );
    });
  });

  describe('builder\'s Handlebars helpers', function() {
    it('should load Handlebars helper: {{section [arg]}}', function() {
      expect(this.files['section-3']).to.include('Handlebars Section Helper Test 3');
      expect(this.files['section-3']).to.include('Section 3 has been successfully loaded.');
      expect(this.files['section-3']).to.include('Handlebars Section Helper Test Fail');
    });

    it('should load Handlebars helper: {{eachSection [arg]}}', function() {
      expect(this.files['section-2']).to.include('Handlebars eachSection Helper Test 2.1.3');
      expect(this.files['section-2']).to.include('Handlebars eachSection Helper Test 2.1.4');
      expect(this.files['section-2']).to.include('Handlebars eachSection Helper: #each modifiers: :hover');
      expect(this.files['section-2']).to.include('Handlebars eachSection Helper: #each modifiers: .stars-given<');
      expect(this.files['section-2']).to.include('Handlebars eachSection Helper: #each modifiers: .stars-given:hover');
      expect(this.files['section-2']).to.include('Handlebars eachSection Helper: #each modifiers: .disabled');
    });
  });
});
