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
  let successMessage = 'Style guide generation completed successfully';

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

  describe('given --config option', function() {
    it('should load configuration from JSON file', function() {
      return kssNode('--config test/fixtures/cli-option-config-source-array.json').then(function(result) {
        expect(result.error).to.not.exist;
        expect(result.stdout).to.include(successMessage);
      });
    });

    it('should add the first unnamed as the source directory', function() {
      let source = helperUtils.fixtures('missing-homepage');
      return kssNode('--config test/fixtures/cli-option-config.json --verbose ' + source).then(function(result) {
        expect(result.error).to.not.exist;
        expect(result.stdout).to.include('* KSS Source  : ' + source + ', ' + helperUtils.fixtures('with-include'));
        expect(result.stdout).to.include(successMessage);

        let source2 = helperUtils.fixtures('includes');
        return kssNode('--config test/fixtures/cli-option-config-source-array.json --verbose ' + source2).then(function(result) {
          expect(result.error).to.not.exist;
          expect(result.stdout).to.include('* KSS Source  : ' + source2 + ', ' + helperUtils.fixtures('with-include') + ', ' + helperUtils.fixtures('missing-homepage'));
          expect(result.stdout).to.include(successMessage);
        });
      });
    });
  });

  describe('given --demo option', function() {
    it('should create a demo style guide', function() {
      return kssNode('--demo --destination ' + helperUtils.fixtures('../output/nested')).then(function(result) {
        expect(result.error).to.not.exist;
        expect(result.stdout).to.include(successMessage);
        expect(result.stdout).to.include('WELCOME to the kss-node demo! We\'ve turned on the --verbose flag so you can see what kss-node is doing.');
      });
    });
  });
});
