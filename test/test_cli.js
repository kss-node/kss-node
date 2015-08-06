/*global describe,it,before,afterEach*/
/*eslint-disable max-nested-callbacks,no-regex-spaces*/

'use strict';

var exec = require('child_process').exec,
  fs = require('fs'),
  path = require('path'),
  testUtils = require('./testUtils'),
  should = require('should');

describe('Command Line Interface', function() {
  var noHomepageWarning = 'no homepage content found',
    failureMessage = 'Error during generation',
    successMessage = 'Style guide generation completed successfully';

  afterEach(function(done) {
    exec('rm -r test/output', function() {
      done();
    });
  });

  describe('given no arguments', function() {
    before(function(done) {
      var self = this;
      exec('bin/kss-node', function(err, stdout, stderr) {
        should.not.exist(err);
        self.stdout = stdout;
        self.stderr = stderr;
        done();
      });
    });

    it('should display help', function(done) {
      this.stderr.should.containEql('Usage:', 'Display usage');
      this.stderr.should.containEql('Options:', 'Display options');
      done();
    });
  });

  describe('given --source option', function() {
    it('should read from source directory', function(done) {
      var source = testUtils.fixtures('with-include');
      exec(
        'bin/kss-node --verbose --source ' + source + ' --destination test/output/nested',
        function(err, stdout) {
          should.not.exist(err);
          stdout.should.containEql('* KSS Source  : ' + source);
          stdout.should.containEql(successMessage);
          done();
        }
      );
    });

    it('should not declare success if source directory is empty', function(done) {
      var source = testUtils.fixtures('empty-source');
      exec(
        'bin/kss-node --verbose --source ' + source + ' --destination test/output/nested',
        function(err, stdout) {
          should.exist(err);
          err.should.be.Error();
          stdout.should.containEql('* KSS Source  : ' + source);
          stdout.should.containEql('No KSS documentation discovered in source files.');
          stdout.should.containEql(failureMessage);
          stdout.should.not.containEql(successMessage);
          done();
        }
      );
    });

    it('should warn if homepage content is not found', function(done) {
      exec(
        'bin/kss-node --source ' + testUtils.fixtures('missing-homepage') + ' --destination test/output/nested',
        function(err, stdout) {
          should.not.exist(err);
          stdout.should.containEql(noHomepageWarning);
          stdout.should.containEql(successMessage);
          done();
        }
      );
    });

    it('should read multiple source directories', function(done) {
      var source = testUtils.fixtures('with-include'),
        source2 = testUtils.fixtures('empty-source');
      exec(
        'bin/kss-node --verbose --source ' + source + ' --source ' + source2 + ' --destination test/output/nested',
        function(err, stdout) {
          should.not.exist(err);
          stdout.should.containEql('* KSS Source  : ' + source + ', ' + source2);
          stdout.should.containEql(successMessage);
          done();
        }
      );
    });
  });

  describe('given --destination option', function() {
    it('should read destination directory', function(done) {
      var source = testUtils.fixtures('with-include'),
        destination = testUtils.fixtures('../output/nested');
      exec(
        'bin/kss-node --verbose ' + source + ' --destination ' + destination,
        function(err, stdout) {
          should.not.exist(err);
          stdout.should.containEql('* Destination : ' + destination);
          done();
        }
      );
    });
  });

  describe('given --custom option', function() {
    it('should read custom properties', function(done) {
      exec(
        'bin/kss-node test/fixtures/with-include test/output/nested --template test/fixtures/template --custom custom --custom custom2',
        function(err) {
          should.not.exist(err);
          fs.readFile(path.join(__dirname, 'output/nested/section-4.html'), 'utf8', function(err2, data) {
            should.not.exist(err2);
            data.should.containEql('"custom" property: This is the first custom property.');
            data.should.containEql('"custom2" property: This is the second custom property.');
            done();
          });
        }
      );
    });
  });

  describe('given --config option', function() {
    it('should load configuration from JSON file', function(done) {
      exec(
        'bin/kss-node --config test/fixtures/cli-option-config.json',
        function(err, stdout) {
          should.not.exist(err);
          stdout.should.containEql(successMessage);
          done();
        }
      );
    });
  });
});
