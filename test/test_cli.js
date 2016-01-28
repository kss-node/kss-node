/* eslint-disable max-nested-callbacks,no-regex-spaces */

'use strict';

const Promise = require('bluebird'),
  cli = require('../lib/cli'),
  mockStream = require('mock-utf8-stream'),
  path = require('path');

const fs = Promise.promisifyAll(require('fs-extra'));

// Instead of child_process.exec, we use the lib/cli.js module and feed it mock
// stdout, stderr and argv.
const kssNode = function(args) {
  let argv = ['node', 'bin/kss-node'],
    stdout = new mockStream.MockWritableStream(),
    stderr = new mockStream.MockWritableStream();

  stdout.startCapture();
  stderr.startCapture();
  if (args) {
    Array.prototype.push.apply(argv, args.split(' '));
  }

  return cli({
    stdout: stdout,
    stderr: stderr,
    argv: argv
  }).catch(function(error) {
    // Pass the error on to the next .then().
    return error;
  }).then(function(result) {
    return {
      error: (result instanceof Error) ? result : null,
      stdout: stdout.capturedData,
      stderr: stderr.capturedData
    };
  });
};

describe('Command Line Interface', function() {
  let noHomepageWarning = 'no homepage content found',
    successMessage = 'Style guide generation completed successfully';

  after(function() {
    return fs.removeAsync(path.resolve('test/output'));
  });

  describe('given no arguments', function() {
    it('should display help', function() {
      return kssNode('').then(function(result) {
        expect(result.error).to.not.exist;
        expect(result.stdout).to.include('Usage:', 'Display usage');
        expect(result.stdout).to.include('Options:', 'Display options');
      });
    });
  });

  describe('given --source option', function() {
    it('should read from source directory', function() {
      let source = helperUtils.fixtures('with-include');
      return kssNode('--verbose --source ' + source + ' --destination test/output/nested').then(function(result) {
        expect(result.error).to.not.exist;
        expect(result.stdout).to.include('* KSS Source  : ' + source);
        expect(result.stdout).to.include(successMessage);
      });
    });

    it('should not declare success if source directory is empty', function() {
      let source = helperUtils.fixtures('empty-source');
      return kssNode('--verbose --source ' + source + ' --destination test/output/nested').then(function(result) {
        expect(result.error).to.exist;
        expect(result.stdout).to.include('* KSS Source  : ' + source);
        expect(result.stderr).to.include('No KSS documentation discovered in source files.');
        expect(result.stdout).to.not.include(successMessage);
      });
    });

    it('should warn if homepage content is not found', function() {
      return kssNode('--source ' + helperUtils.fixtures('missing-homepage') + ' --destination test/output/nested').then(function(result) {
        expect(result.error).to.not.exist;
        expect(result.stdout).to.include(noHomepageWarning);
        expect(result.stdout).to.include(successMessage);
      });
    });

    it('should read multiple source directories', function() {
      let source = helperUtils.fixtures('with-include'),
        source2 = helperUtils.fixtures('empty-source');
      return kssNode('--verbose --source ' + source + ' --source ' + source2 + ' --destination test/output/nested').then(function(result) {
        expect(result.error).to.not.exist;
        expect(result.stdout).to.include('* KSS Source  : ' + source + ', ' + source2);
        expect(result.stdout).to.include(successMessage);
      });
    });
  });

  describe('given --destination option', function() {
    it('should read destination directory', function() {
      let source = helperUtils.fixtures('with-include'),
        destination = helperUtils.fixtures('../output/nested');
      return kssNode('--verbose ' + source + ' --destination ' + destination).then(function(result) {
        expect(result.error).to.not.exist;
        expect(result.stdout).to.include('* Destination : ' + destination);
      });
    });
  });

  describe('given unnamed option', function() {
    it('should use the first unnamed as the source directory', function() {
      let source = helperUtils.fixtures('with-include'),
        destination = helperUtils.fixtures('../output/nested');
      return kssNode('--verbose ' + source + ' --destination ' + destination).then(function(result) {
        expect(result.error).to.not.exist;
        expect(result.stdout).to.include('* KSS Source  : ' + source);
        expect(result.stdout).to.include(successMessage);
      });
    });

    it('should use the second unnamed as the destination directory', function() {
      let source = helperUtils.fixtures('with-include'),
        destination = helperUtils.fixtures('../output/nested');
      return kssNode('--verbose ' + source + ' ' + destination).then(function(result) {
        expect(result.error).to.not.exist;
        expect(result.stdout).to.include('* Destination : ' + destination);
      });
    });
  });

  describe('given --custom option', function() {
    it('should read custom properties', function() {
      return kssNode('test/fixtures/with-include test/output/custom --template test/fixtures/template --custom custom --custom custom2').then(function(result) {
        expect(result.error).to.not.exist;
        return fs.readFileAsync(path.join(__dirname, 'output/custom/section-4.html'), 'utf8').then(function(data) {
          expect(data).to.include('"custom" property: This is the first custom property.');
          expect(data).to.include('"custom2" property: This is the second custom property.');
        }).catch(function(error) {
          expect(error).to.not.exist;
        });
      });
    });
  });

  describe('given --config option', function() {
    it('should load configuration from JSON file', function() {
      return kssNode('--config test/fixtures/cli-option-config.json').then(function(result) {
        expect(result.error).to.not.exist;
        expect(result.stdout).to.include(successMessage);
      });
    });
  });

  describe('given --clone option', function() {
    it('should copy the template', function() {
      // This test is long.
      this.timeout(4000);
      return kssNode('--clone test/output/template').then(function(result) {
        expect(result.error).to.not.exist;
        expect(result.stderr).to.be.string('');
        expect(result.stdout).to.include('Creating a new style guide template in ' + path.resolve('test/output/template') + '...');
      });
    });

    it('should use a default path', function() {
      let defaultPath = path.resolve('custom-template');
      // This test is long.
      this.timeout(4000);
      return kssNode('--clone').then(function(result) {
        fs.removeSync(defaultPath);
        expect(result.error).to.not.exist;
        expect(result.stderr).to.be.string('');
        expect(result.stdout).to.include('Creating a new style guide template in ' + defaultPath + '...');
      });
    });

    it('should error if the destination folder exists', function() {
      let existingFolder = path.resolve('test/fixtures/template');
      return kssNode('--clone ' + existingFolder).then(function(result) {
        expect(result.error).to.exist;
        expect(result.error.message).to.include('This folder already exists: ' + existingFolder);
      });
    });
  });
});
