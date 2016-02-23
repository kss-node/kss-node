/* eslint-disable max-nested-callbacks */

'use strict';

const mockStream = require('mock-utf8-stream'),
  Promise = require('bluebird');

const fs = Promise.promisifyAll(require('fs-extra'));

const testKss = function(options) {
  options.pipes = options.pipes || {};

  // For our tests, feed kss() mock stdout and stderr so we can capture the
  // output easier.
  options.pipes.stdout = new mockStream.MockWritableStream();
  options.pipes.stderr = new mockStream.MockWritableStream();
  options.pipes.stdout.startCapture();
  options.pipes.stderr.startCapture();

  return kss(options).catch(function(error) {
    // Pass the error on to the next .then() method.
    return error;
  }).then(function(result) {
    return {
      error: (result instanceof Error) ? result : null,
      stdout: options.pipes.stdout.capturedData,
      stderr: options.pipes.stderr.capturedData
    };
  });
};

describe('kss object API', function() {
  let noHomepageWarning = 'no homepage content found',
    successMessage = 'Style guide build completed successfully';

  it('should be a function taking 1 argument', function(done) {
    expect(kss).to.exist;
    expect(kss).to.be.a('Function');
    expect(kss.length).to.equal(1);
    done();
  });

  /* eslint-disable no-loop-func */
  ['parse',
    'traverse'
  ].forEach(function(method) {
    it('has ' + method + '() method', function(done) {
      expect(kss).to.itself.respondTo(method);
      done();
    });
  });

  ['KssConfig',
    'KssModifier',
    'KssParameter',
    'KssSection',
    'KssStyleGuide'
  ].forEach(function(method) {
    it('has ' + method + '() constructor', function(done) {
      expect(kss).to.itself.respondTo(method);
      let Constructor = require('../lib/' + method.replace('Kss', 'kss_').toLowerCase());
      expect(new kss[method]()).to.be.an.instanceof(Constructor);
      done();
    });
  });
  /* eslint-enable no-loop-func */

  describe('given no options', function() {
    it('should display error', function() {
      return testKss({}).then(function(response) {
        expect(response.stderr).to.include('No "source" option specified.');
        return kss().catch(error => {
          expect(error).to.exist;
        });
      });
    });
  });

  describe('given "source" option', function() {
    it('should read from source directory', function() {
      let source = helperUtils.fixtures('with-include');
      return testKss({
        verbose: true,
        source: source,
        destination: 'test/output/nested'
      }).then(function(result) {
        expect(result.error).to.not.exist;
        expect(result.stdout).to.include('* KSS Source  : ' + source);
        expect(result.stdout).to.include(successMessage);
      });
    });

    it('should not declare success if source directory is empty', function() {
      let source = helperUtils.fixtures('empty-source');
      return testKss({
        verbose: true,
        source: source,
        destination: 'test/output/nested'
      }).then(function(result) {
        expect(result.error).to.exist;
        expect(result.stdout).to.include('* KSS Source  : ' + source);
        expect(result.stderr).to.include('No KSS documentation discovered in source files.');
        expect(result.stdout).to.not.include(successMessage);
      });
    });

    it('should warn if homepage content is not found', function() {
      return testKss({
        source: helperUtils.fixtures('missing-homepage'),
        destination: 'test/output/nested'
      }).then(function(result) {
        expect(result.error).to.not.exist;
        expect(result.stdout).to.include(noHomepageWarning);
        expect(result.stdout).to.include(successMessage);
      });
    });

    it('should read multiple source directories', function() {
      let source = helperUtils.fixtures('with-include'),
        source2 = helperUtils.fixtures('empty-source');
      return testKss({
        verbose: true,
        source: [source, source2],
        destination: 'test/output/nested'
      }).then(function(result) {
        expect(result.error).to.not.exist;
        expect(result.stdout).to.include('* KSS Source  : ' + source + ', ' + source2);
        expect(result.stdout).to.include(successMessage);
      });
    });
  });

  describe('given "destination" option', function() {
    it('should read destination directory', function() {
      let source = helperUtils.fixtures('with-include'),
        destination = helperUtils.fixtures('..', 'output', 'nested');
      return testKss({
        verbose: true,
        source: source,
        destination: destination
      }).then(function(result) {
        expect(result.error).to.not.exist;
        expect(result.stdout).to.include('* Destination : ' + destination);
      });
    });
  });

  describe('given "builder" option', function() {
    it('should provide an error if KssBuilder.checkBuilder() method fails', function() {
      return testKss({builder: helperUtils.fixtures('old-builder')}).then(function(response) {
        expect(response.error).to.exist;
        expect(response.stderr).to.include('kss-node expected the builder to implement KssBuilder API version 3.0; version "1.0" is being used instead.');
      });
    });

    it('should provide an error if given a KssGenerator 2.0', function() {
      return testKss({builder: helperUtils.fixtures('old-generator')}).then(function(response) {
        expect(response.error).to.exist;
        expect(response.stderr).to.include('kss-node expected the builder to implement KssBuilder API version 3.0; version "2.0" is being used instead.');
      });
    });
  });

  describe('given "custom" option', function() {
    it('should read custom properties', function() {
      return testKss({
        source: 'test/fixtures/with-include',
        destination: 'test/output/custom',
        builder: 'test/fixtures/builder',
        custom: ['custom', 'custom2']
      }).then(function(result) {
        expect(result.error).to.not.exist;
        return fs.readFileAsync(path.join(__dirname, 'output', 'custom', 'section-4.html'), 'utf8').then(function(data) {
          expect(data).to.include('"custom" property: This is the first custom property.');
          expect(data).to.include('"custom2" property: This is the second custom property.');
        }, function(error) {
          expect(error).to.not.exist;
        });
      });
    });
  });

  describe('given "clone" option', function() {
    it('should copy the builder', function() {
      // This test is long.
      this.timeout(4000);
      return testKss({
        clone: 'test/output/builder'
      }).then(function(result) {
        expect(result.error).to.not.exist;
        expect(result.stderr).to.be.string('');
        expect(result.stdout).to.include('Creating a new style guide builder in ' + path.resolve('test', 'output', 'builder') + '...');
      });
    });

    it('should use a default path', function() {
      let defaultPath = path.resolve('custom-builder');
      // This test is long.
      this.timeout(4000);
      return testKss({
        clone: true
      }).then(function(result) {
        fs.removeSync(defaultPath);
        expect(result.error).to.not.exist;
        expect(result.stderr).to.be.string('');
        expect(result.stdout).to.include('Creating a new style guide builder in ' + defaultPath + '...');
      });
    });

    it('should error if the destination folder exists', function() {
      let existingFolder = path.resolve('test', 'fixtures', 'builder');
      return testKss({
        clone: existingFolder
      }).then(function(result) {
        expect(result.error).to.exist;
        expect(result.error.message).to.include('This folder already exists: ' + existingFolder);
      });
    });
  });
});
