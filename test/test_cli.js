/* eslint-disable max-nested-callbacks,no-regex-spaces */

'use strict';

const cli = require('../lib/cli'),
  mockStream = require('mock-utf8-stream');

const API = '3.0';

// Instead of child_process.exec, we use the lib/cli.js module and feed it mock
// stdout, stderr and argv.
const kssNode = function(args) {
  let argv = ['node', 'bin/kss'],
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
  let successMessage = 'Style guide build completed successfully';

  after(function() {
    return fs.removeAsync(path.resolve('test', 'output'));
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
        destination = helperUtils.fixtures('..', 'output', 'nested');
      return kssNode('--verbose ' + source + ' --destination ' + destination).then(function(result) {
        expect(result.error).to.not.exist;
        expect(result.stdout).to.include('* KSS Source  : ' + source);
        expect(result.stdout).to.include(successMessage);
      });
    });

    it('should use the second unnamed as the destination directory', function() {
      let source = helperUtils.fixtures('with-include'),
        destination = helperUtils.fixtures('..', 'output', 'nested');
      return kssNode('--verbose ' + source + ' ' + destination).then(function(result) {
        expect(result.error).to.not.exist;
        expect(result.stdout).to.include('* Destination : ' + destination);
      });
    });
  });

  describe('given --config option', function() {
    it('should load options from a JSON file', function() {
      return kssNode('--config test/fixtures/cli-option-config-source-array.json').then(function(result) {
        expect(result.error).to.not.exist;
        expect(result.stdout).to.include(successMessage);
      });
    });

    it('should load the Twig builder when given the config file uses "builder/twig"', function() {
      return kssNode('--config test/fixtures/cli-option-config-twig.json --verbose').then(result => {
        expect(result.error).to.not.exist;
        expect(result.stdout).to.include(successMessage);
        expect(result.stdout).to.include('Builder     : ' + path.resolve(__dirname, '..', 'builder', 'twig'));
      });
    });

    it('should catch an error if the builder path does not exist', function() {
      return kssNode('--config test/fixtures/cli-option-config-builder-nonexistant.json --verbose').then(result => {
        expect(result.error).to.exist;
        expect(result.stderr).to.include('The builder path, "' + path.resolve(__dirname, 'fixtures', 'nonexistant', 'path') + '", is not a directory.');
      });
    });

    it('should catch an error if the builder path is not a directory', function() {
      return kssNode('--config test/fixtures/cli-option-config-builder-notdirectory.json --verbose').then(result => {
        expect(result.error).to.exist;
        expect(result.stderr).to.include('The builder path, "' + path.resolve(__dirname, 'fixtures', 'cli-option-config.json') + '", is not a directory.');
      });
    });

    it('should add the first unnamed as the source directory', function() {
      let source = helperUtils.fixtures('missing-homepage');
      return kssNode('--config test/fixtures/cli-option-config.json --verbose ' + source).then(function(result) {
        expect(result.error).to.not.exist;
        expect(result.stdout).to.include('* KSS Source  : ' + source + ', ' + helperUtils.fixtures('with-include'));
        expect(result.stdout).to.include(successMessage);

        let source2 = helperUtils.fixtures('traverse-directories/includes');
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
      return kssNode('--demo --destination ' + helperUtils.fixtures('..', 'output', 'nested')).then(function(result) {
        expect(result.error).to.not.exist;
        expect(result.stdout).to.include(successMessage);
        expect(result.stdout).to.include('WELCOME to the kss demo! We\'ve turned on the --verbose flag so you can see what kss is doing.');
      });
    });
  });

  describe('given --builder option', function() {
    it('should catch a failure when the builder API is not equal to the current API', function() {
      return kssNode('--builder ' + helperUtils.fixtures('old-builder')).then(result => {
        expect(result.error).to.exist;
        expect(result.stderr).to.include('kss expected the builder to implement KssBuilderBase API version ' + API + '; version "1.0" is being used instead.');
      });
    });

    it('should load the Twig builder when given the string "builder/twig"', function() {
      return kssNode('--builder builder/twig --verbose --source ' + helperUtils.fixtures('source-twig-builder-test') + ' --destination ' + helperUtils.fixtures('..', 'output', 'nested')).then(result => {
        expect(result.error).to.not.exist;
        expect(result.stdout).to.include(successMessage);
        expect(result.stdout).to.include('Builder     : ' + path.resolve(__dirname, '..', 'builder', 'twig'));
      });
    });
  });

  describe('given --verbose option two or more times', function() {
    it('should display error in builder with stack', function() {
      return kssNode('--verbose --verbose --builder ' + helperUtils.fixtures('old-builder')).then(response => {
        let kssBuilderBase = path.resolve(__dirname, '..', 'builder', 'base', 'kss_builder_base.js');
        expect(response.error).to.exist;
        expect(response.stderr).to.include('Error: kss expected the builder to implement KssBuilderBase API version ' + API + '; version "1.0" is being used instead.\n    at ');
        expect(response.stderr).to.include(kssBuilderBase);
      });
    });

    it('should display error in kss() with stack', function() {
      return kssNode('--verbose --verbose').then(function(response) {
        let kssPath = path.resolve(__dirname, '..', 'lib', 'kss.js');
        expect(response.error).to.exist;
        expect(response.stderr).to.include('No "source" option specified.\n    at ');
        expect(response.stderr).to.include(kssPath);
      });
    });
  });
});
