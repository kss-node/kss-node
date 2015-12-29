/* eslint-disable max-nested-callbacks,no-regex-spaces */

'use strict';

var cli = require('../lib/cli'),
  fs = require('fs'),
  mockStream = require('mock-utf8-stream'),
  path = require('path'),
  wrench = require('wrench');

var kssNode;

// Instead of child_process.exec, we use the lib/cli.js module and feed it mock
// stdout, stderr and argv.
kssNode = function(args, cb) {
  var argv = ['node', 'bin/kss-node'],
    stdout = new mockStream.MockWritableStream(),
    stderr = new mockStream.MockWritableStream();

  stdout.startCapture();
  stderr.startCapture();
  if (args) {
    Array.prototype.push.apply(argv, args.split(' '));
  }

  cli({
    stdout: stdout,
    stderr: stderr,
    argv: argv
  }, function(error) {
    cb(error, stdout.capturedData, stderr.capturedData);
  });
};

describe('Command Line Interface', function() {
  var noHomepageWarning = 'no homepage content found',
    successMessage = 'Style guide generation completed successfully';

  after(function(done) {
    wrench.rmdirRecursive(path.resolve('test/output'), function(error) {
      done(error ? error : null);
    });
  });

  describe('given no arguments', function() {
    it('should display help', function(done) {
      kssNode('',
        function(error, stdout) {
          expect(error).to.not.exist;
          expect(stdout).to.include('Usage:', 'Display usage');
          expect(stdout).to.include('Options:', 'Display options');
          done();
        }
      );
    });
  });

  describe('given --source option', function() {
    it('should read from source directory', function(done) {
      var source = helperUtils.fixtures('with-include');
      kssNode('--verbose --source ' + source + ' --destination test/output/nested',
        function(error, stdout) {
          expect(error).to.not.exist;
          expect(stdout).to.include('* KSS Source  : ' + source);
          expect(stdout).to.include(successMessage);
          done();
        }
      );
    });

    it('should not declare success if source directory is empty', function(done) {
      var source = helperUtils.fixtures('empty-source');
      kssNode('--verbose --source ' + source + ' --destination test/output/nested',
        function(err, stdout, stderr) {
          expect(err).to.exist;
          expect(stdout).to.include('* KSS Source  : ' + source);
          expect(stderr).to.include('No KSS documentation discovered in source files.');
          expect(stdout).to.not.include(successMessage);
          done();
        }
      );
    });

    it('should warn if homepage content is not found', function(done) {
      kssNode('--source ' + helperUtils.fixtures('missing-homepage') + ' --destination test/output/nested',
        function(err, stdout) {
          expect(err).to.not.exist;
          expect(stdout).to.include(noHomepageWarning);
          expect(stdout).to.include(successMessage);
          done();
        }
      );
    });

    it('should read multiple source directories', function(done) {
      var source = helperUtils.fixtures('with-include'),
        source2 = helperUtils.fixtures('empty-source');
      kssNode('--verbose --source ' + source + ' --source ' + source2 + ' --destination test/output/nested',
        function(err, stdout) {
          expect(err).to.not.exist;
          expect(stdout).to.include('* KSS Source  : ' + source + ', ' + source2);
          expect(stdout).to.include(successMessage);
          done();
        }
      );
    });
  });

  describe('given --destination option', function() {
    it('should read destination directory', function(done) {
      var source = helperUtils.fixtures('with-include'),
        destination = helperUtils.fixtures('../output/nested');
      kssNode('--verbose ' + source + ' --destination ' + destination,
        function(err, stdout) {
          expect(err).to.not.exist;
          expect(stdout).to.include('* Destination : ' + destination);
          done();
        }
      );
    });
  });

  describe('given unnamed option', function() {
    it('should use the first unnamed as the source directory', function(done) {
      var source = helperUtils.fixtures('with-include'),
        destination = helperUtils.fixtures('../output/nested');
      kssNode('--verbose ' + source + ' --destination ' + destination,
        function(err, stdout) {
          expect(err).to.not.exist;
          expect(stdout).to.include('* KSS Source  : ' + source);
          expect(stdout).to.include(successMessage);
          done();
        }
      );
    });

    it('should use the second unnamed as the destination directory', function(done) {
      var source = helperUtils.fixtures('with-include'),
        destination = helperUtils.fixtures('../output/nested');
      kssNode('--verbose ' + source + ' ' + destination,
        function(err, stdout) {
          expect(err).to.not.exist;
          expect(stdout).to.include('* Destination : ' + destination);
          done();
        }
      );
    });
  });

  describe('given --custom option', function() {
    it('should read custom properties', function(done) {
      kssNode('test/fixtures/with-include test/output/custom --template test/fixtures/template --custom custom --custom custom2',
        function(err) {
          expect(err).to.not.exist;
          fs.readFile(path.join(__dirname, 'output/custom/section-4.html'), 'utf8', function(err2, data) {
            expect(err2).to.not.exist;
            expect(data).to.include('"custom" property: This is the first custom property.');
            expect(data).to.include('"custom2" property: This is the second custom property.');
            done();
          });
        }
      );
    });
  });

  describe('given --config option', function() {
    it('should load configuration from JSON file', function(done) {
      kssNode('--config test/fixtures/cli-option-config.json',
        function(err, stdout) {
          expect(err).to.not.exist;
          expect(stdout).to.include(successMessage);
          done();
        }
      );
    });
  });

  describe('given --clone option', function() {
    it('should copy the template', function(done) {
      kssNode('--clone test/output/template',
        function(err, stdout) {
          expect(err).to.not.exist;
          expect(stdout).to.include('Creating a new style guide template...');
          expect(stdout).to.include('kss-node [sourcedir] --template ' + path.resolve('test/output/template'));
          done();
        }
      );
    });

    it('should use a default path', function(done) {
      var defaultPath = path.resolve('custom-template');
      kssNode('--clone',
        function(err, stdout) {
          expect(err).to.not.exist;
          expect(stdout).to.include('kss-node [sourcedir] --template ' + defaultPath);

          wrench.rmdirRecursive(defaultPath, function(error) {
            done(error ? error : null);
          });
        }
      );
    });

    it('should error if the destination folder exists', function(done) {
      var existingFolder = path.resolve('test/fixtures/template');
      kssNode('--clone ' + existingFolder,
        function(error) {
          expect(error).to.exist;
          expect(error.message).to.include('This folder already exists: ' + existingFolder);
          done();
        }
      );
    });
  });
});
