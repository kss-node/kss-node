/* eslint-disable max-nested-callbacks */

'use strict';

const KssBuilderBase = require('../builder/base'),
  KssBuilderBaseExample = require('../builder/base/example'),
  mockStream = require('mock-utf8-stream');

class TestKssBuilderBaseExample extends KssBuilderBaseExample {
  constructor(options) {
    super();

    options = options || {};

    if (!options.builder) {
      options.builder = path.resolve(__dirname, '..', 'builder', 'twig');
    }

    // For our tests, feed kss() log functions that mock stdout and stderr so we
    // can capture the output easier.
    this.testStreams = {};
    this.testStreams.stdout = new mockStream.MockWritableStream();
    this.testStreams.stderr = new mockStream.MockWritableStream();
    this.testStreams.stdout.startCapture();
    this.testStreams.stderr.startCapture();
    options.logFunction = (function() {
      let message = '';
      for (let i = 0; i < arguments.length; i++) {
        message += arguments[i];
      }
      this.testStreams.stdout.write(message + '\n');
    }).bind(this);
    options.logErrorFunction = (function(error) {
      // Show the full error stack if the verbose option is used twice or more.
      this.testStreams.stderr.write(((error.stack && options.verbose > 1) ? error.stack : error) + '\n');
    }).bind(this);

    this.addOptions(options);
  }

  getTestOutput(pipe) {
    if (typeof pipe === 'undefined') {
      return {
        stdout: this.testStreams.stdout.capturedData,
        stderr: this.testStreams.stderr.capturedData
      };
    } else {
      return this.testStreams[pipe].capturedData;
    }
  }
}

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
    let builder = new TestKssBuilderBaseExample(),
      destinationPath = path.resolve(__dirname, 'output', 'example');
    return builder.clone('', destinationPath).then(() => {
      expect(builder.getTestOutput('stdout')).to.contain('Example builder cloned to ' + destinationPath + '! (not really.)');
    });
  });

  it('should have a working prepare() method', function() {
    let builder = new TestKssBuilderBaseExample(),
      originalStyleGuide = new kss.KssStyleGuide({sections: [{header: 'Section One'}, {header: 'Section Two'}]});
    return builder.prepare(originalStyleGuide).then(styleGuide => {
      expect(builder.getOptions('source')[0]).to.equal(path.resolve(__dirname, '..', 'demo'));
      expect(builder.warningMessage).to.equal(' (not really.)');
      expect(builder.getTestOutput('stdout')).to.contain('...Preparing the style guide.' + ' (not really.)');
      expect(styleGuide).to.deep.equal(originalStyleGuide);
    });
  });

  it('should have a working build() method', function() {
    let builder = new TestKssBuilderBaseExample(),
      originalStyleGuide = new kss.KssStyleGuide({sections: [{header: 'Section One'}, {header: 'Section Two'}]});
    return builder.prepare(originalStyleGuide).then(styleGuide => {
      return builder.build(styleGuide).then(styleGuide => {
        expect(builder.getTestOutput('stdout')).to.contain('...Building the demo style guide.' + ' (not really.)');
        expect(styleGuide).to.deep.equal(originalStyleGuide);
      });
    });
  });
});
