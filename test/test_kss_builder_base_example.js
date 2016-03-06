/* eslint-disable max-nested-callbacks */

'use strict';

const KssBuilderBase = require('../builder/base'),
  KssBuilderBaseExample = require('../builder/base/example'),
  mockStream = require('mock-utf8-stream');

const testBuilder = function(options) {
  options = options || {};

  let builder = new KssBuilderBaseExample();

  // For our tests, feed kss() log functions that mock stdout and stderr so we
  // can capture the output easier.
  options.pipes = {};
  options.pipes.stdout = new mockStream.MockWritableStream();
  options.pipes.stderr = new mockStream.MockWritableStream();
  options.pipes.stdout.startCapture();
  options.pipes.stderr.startCapture();
  options.logFunction = function() {
    let message = '';
    for (let i = 0; i < arguments.length; i++) {
      message += arguments[i];
    }
    options.pipes.stdout.write(message + '\n');
  };
  options.logErrorFunction = function(error) {
    // Show the full error stack if the verbose option is used twice or more.
    options.pipes.stderr.write(((error.stack && options.verbose > 1) ? error.stack : error) + '\n');
  };

  builder.addOptions(options);

  return builder;
};

const getBuilderOutput = function(builder, pipe) {
  let pipes = builder.getOptions('pipes');

  if (typeof pipe === 'undefined') {
    return {
      stdout: pipes.stdout.capturedData,
      stderr: pipes.stderr.capturedData
    };
  } else {
    return pipes[pipe].capturedData;
  }
};

describe('KssBuilderBaseExample object API', function() {

  describe('KssBuilderBaseExample constructor', function() {
    it('should create an instance of KssBuilderBase', function() {
      const builder = new KssBuilderBaseExample();
      expect(builder).to.be.instanceOf(KssBuilderBaseExample);
      expect(builder).to.be.instanceOf(KssBuilderBase);
    });

    it('should set the proper API version', function() {
      let builder = new KssBuilderBaseExample();
      expect(builder.API).to.equal('3.0');
    });

    it('should implement the default option definitions', function() {
      let builder = new KssBuilderBaseExample();
      expect(Object.getOwnPropertyNames(builder.optionDefinitions)).to.deep.equal(['source', 'destination', 'mask', 'clone', 'builder', 'css', 'js', 'custom', 'verbose', 'example-option']);
    });
  });

  it('should have a working clone() method', function() {
    let builder = testBuilder(),
      destinationPath = path.resolve(__dirname, 'output', 'example');
    return builder.clone('', destinationPath).then(() => {
      expect(getBuilderOutput(builder, 'stdout')).to.contain('Example builder cloned to ' + destinationPath + '! (not really.)');
    });
  });

  it('should have a working init() method', function() {
    let builder = testBuilder();
    return builder.init().then(() => {
      expect(builder.getOptions('source')[0]).to.equal(path.resolve(__dirname, '..', 'demo'));
      expect(builder.warningMessage).to.equal(' (not really.)');
    });
  });

  it('should have a working prepare() method', function() {
    let builder = testBuilder(),
      styleGuide = new kss.KssStyleGuide({sections: [{header: 'Section One'}, {header: 'Section Two'}]});
    return builder.init().then(() => {
      return builder.prepare(styleGuide).then(sg => {
        expect(getBuilderOutput(builder, 'stdout')).to.contain('...Preparing the style guide.' + ' (not really.)');
        expect(sg).to.deep.equal(styleGuide);
      });
    });
  });

  it('should have a working build() method', function() {
    let builder = testBuilder(),
      styleGuide = new kss.KssStyleGuide({sections: [{header: 'Section One'}, {header: 'Section Two'}]});
    return builder.init().then(() => {
      return builder.build(styleGuide).then(sg => {
        expect(getBuilderOutput(builder, 'stdout')).to.contain('...Building the demo style guide.' + ' (not really.)');
        expect(sg).to.deep.equal(styleGuide);
      });
    });
  });
});
