/* eslint-disable max-nested-callbacks */

'use strict';

const mockStream = require('mock-utf8-stream');

const API = '3.0';

const testKss = function(options) {
  // For our tests, feed kss() log functions that mock stdout and stderr so we
  // can capture the output easier.
  let stdout = new mockStream.MockWritableStream();
  let stderr = new mockStream.MockWritableStream();
  stdout.startCapture();
  stderr.startCapture();
  options.logFunction = function() {
    let message = '';
    for (let i = 0; i < arguments.length; i++) {
      message += arguments[i];
    }
    stdout.write(message + '\n');
  };
  options.logErrorFunction = function(error) {
    // Show the full error stack if the verbose option is used twice or more.
    stderr.write(((error.stack && options.verbose > 1) ? error.stack : error) + '\n');
  };

  return kss(options).catch(error => {
    // Pass the error on to the next .then() method.
    return error;
  }).then(result => {
    return {
      error: (result instanceof Error) ? result : null,
      result: (result instanceof Error) ? null : result,
      stdout: stdout.capturedData,
      stderr: stderr.capturedData
    };
  });
};

describe('kss object API', function() {
  let noHomepageWarning = 'no homepage content found',
    successMessage = 'Style guide build completed successfully';

  /* eslint-disable no-loop-func */
  ['parse',
    'traverse'
  ].forEach(function(method) {
    it('has ' + method + '() method', function(done) {
      expect(kss).to.itself.respondTo(method);
      done();
    });
  });

  ['KssModifier',
    'KssParameter',
    'KssSection',
    'KssStyleGuide'
  ].forEach(function(method) {
    it('has ' + method + '() constructor', function(done) {
      expect(kss).to.itself.respondTo(method);
      let Constructor = require('../lib/' + method.replace('Kss', 'kss_').replace('Guide', '_guide').toLowerCase());
      expect(new kss[method]()).to.be.an.instanceof(Constructor);
      done();
    });
  });
  /* eslint-enable no-loop-func */

  describe('kss() function', function() {
    it('should be a function taking 1 argument', function(done) {
      expect(kss).to.exist;
      expect(kss).to.be.a('Function');
      expect(kss.length).to.equal(1);
      done();
    });

    it('should return a promise resolving to a KssStyleGuide', function() {
      let source = helperUtils.fixtures('with-include');
      let obj = testKss({
        verbose: true,
        source: source,
        destination: 'test/output/kss-result'
      });
      return obj.then(function(result) {
        expect(obj).to.be.instanceof(Promise);
        expect(result.error).to.not.exist;
        expect(result.result).to.be.instanceof(kss.KssStyleGuide);
        expect(result.stdout).to.include(successMessage);
      });
    });

    describe('given no options', function() {
      it('should display error', function() {
        return testKss({}).then(function(response) {
          expect(response.error).to.exist;
          expect(response.stderr).to.include('No "source" option specified.');
          return kss().then(() => {
            return Promise.reject(new Error('kss() should fail, but does not'));
          }).catch(error => {
            expect(error).to.exist;
            expect(error.message).to.equal('No "source" option specified.');
          });
        });
      });
    });

    describe('given "verbose" option', function() {
      it('should display a message when starting to parse', function() {
        return testKss({
          verbose: true,
          source: helperUtils.fixtures('empty-source')
        }).then(function(response) {
          expect(response.error).to.exist;
          expect(response.stdout).to.include('...Parsing your style guide:');
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
      it('should write to destination directory', function() {
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
      it('should provide an error if KssBuilderBase.loadBuilder() method fails', function() {
        return testKss({builder: helperUtils.fixtures('old-builder')}).then(function(response) {
          expect(response.error).to.exist;
          expect(response.stderr).to.include('kss expected the builder to implement KssBuilderBase API version ' + API + '; version "1.0" is being used instead.');
          return kss({builder: helperUtils.fixtures('old-builder')}).then(() => {
            return Promise.reject(new Error('kss() should fail, but does not'));
          }).catch(error => {
            expect(error).to.exist;
            expect(error.message).to.equal('kss expected the builder to implement KssBuilderBase API version ' + API + '; version "1.0" is being used instead.');
          });
        });
      });

      it('should provide an error if given a KssGenerator 2.0', function() {
        return testKss({builder: helperUtils.fixtures('old-generator')}).then(function(response) {
          expect(response.error).to.exist;
          expect(response.stderr).to.include('kss expected the builder to implement KssBuilderBase API version ' + API + '; version "2.0" is being used instead.');
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
});
