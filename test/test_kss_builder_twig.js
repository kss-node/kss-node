/* eslint-disable max-nested-callbacks,no-regex-spaces */

'use strict';

const cli = require('../lib/cli'),
  mockStream = require('mock-utf8-stream');

describe('KssBuilderTwig builder', function() {
  before(function() {
    let stdout = new mockStream.MockWritableStream(),
      stderr = new mockStream.MockWritableStream();

    stdout.startCapture();
    stderr.startCapture();

    this.files = {};

    return cli({
      stdout: stdout,
      stderr: stderr,
      argv: ['node', 'bin/kss', 'test/fixtures/with-include', 'test/output/twig', '--builder', 'builder/twig', '--title', 'KssBuilderTwig Test Style Guide', '--verbose']
    }).then(() => {
      this.stdout = stdout.capturedData;
      return Promise.all(
        [
          'index',
          'section-2',
          'section-3',
          'section-4'
        ].map(fileName => {
          return fs.readFileAsync(path.join(__dirname, 'output', 'twig', fileName + '.html'), 'utf8').then(data => {
            this.files[fileName] = data;
          });
        })
      );
    });
  });

  it('should build successfully', function() {
    [
      'index',
      'section-2',
      'section-3',
      'section-4'
    ].forEach(fileName => {
      expect(this.files).to.have.property(fileName);
      expect(this.files[fileName]).to.not.be.empty;
    });
  });

  it('should render the --title option', function() {
    expect(this.files['index']).to.include('<title>KssBuilderTwig Test Style Guide</title>');
  });
});
