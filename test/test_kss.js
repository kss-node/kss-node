/* eslint-disable max-nested-callbacks */

'use strict';

const // fs = require('fs'),
  mockStream = require('mock-utf8-stream');

const testKss = function(options, done) {
  options.pipes = options.pipes || {};

  // For our tests, feed kss() mock stdout and stderr so we can capture the
  // output easier.
  options.pipes.stdout = new mockStream.MockWritableStream();
  options.pipes.stderr = new mockStream.MockWritableStream();
  options.pipes.stdout.startCapture();
  options.pipes.stderr.startCapture();

  kss(options, function(error) {
    done(error, options.pipes.stdout.capturedData, options.pipes.stderr.capturedData);
  });
};

describe('kss object API', function() {
  it('should be a function taking 2 arguments', function(done) {
    expect(kss).to.exist;
    expect(kss).to.be.a('Function');
    expect(kss.length).to.equal(2);
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
    it('should display error', function(done) {
      testKss({},
        function(error, stdout, stderr) {
          expect(error).to.exist;
          expect(stderr).to.include('No "source" option specified.');
          done();
        }
      );
    });
  });
});
