/* eslint-disable max-nested-callbacks */

'use strict';

const KssBuilderBase = require('../builder/base'),
  KssBuilderBaseHandlebars = require('../builder/base/handlebars'),
  mockStream = require('mock-utf8-stream');

const testBuilder = function(options) {
  options = options || {};

  let builder = new KssBuilderBaseHandlebars();

  // For our tests, feed kss() log functions that mock stdout and stderr so we
  // can capture the output easier.
  options.testStreams = {};
  options.testStreams.stdout = new mockStream.MockWritableStream();
  options.testStreams.stderr = new mockStream.MockWritableStream();
  options.testStreams.stdout.startCapture();
  options.testStreams.stderr.startCapture();
  options.logFunction = function() {
    let message = '';
    for (let i = 0; i < arguments.length; i++) {
      message += arguments[i];
    }
    options.testStreams.stdout.write(message + '\n');
  };
  options.logErrorFunction = function(error) {
    // Show the full error stack if the verbose option is used twice or more.
    options.testStreams.stderr.write(((error.stack && options.verbose > 1) ? error.stack : error) + '\n');
  };

  builder.addOptions(options);

  builder.getTestOutput = function(pipe) {
    let streams = this.getOptions('testStreams');

    if (typeof pipe === 'undefined') {
      return {
        stdout: streams.stdout.capturedData,
        stderr: streams.stderr.capturedData
      };
    } else {
      return streams[pipe].capturedData;
    }
  };

  return builder;
};

describe('KssBuilderBaseHandlebars object API', function() {

  describe('KssBuilderBaseHandlebars constructor', function() {
    it('should create an instance of KssBuilderBase', function() {
      const builder = new KssBuilderBaseHandlebars();
      expect(builder).to.be.instanceOf(KssBuilderBaseHandlebars);
      expect(builder).to.be.instanceOf(KssBuilderBase);
    });

    it('should set the proper API version', function() {
      let builder = new KssBuilderBaseHandlebars();
      expect(builder.API).to.equal('3.0');
    });

    it('should implement the default option definitions', function() {
      let builder = new KssBuilderBaseHandlebars();
      expect(Object.getOwnPropertyNames(builder.optionDefinitions)).to.deep.equal(['source', 'destination', 'mask', 'clone', 'builder', 'css', 'js', 'custom', 'verbose', 'helpers', 'homepage', 'placeholder', 'nav-depth']);
    });
  });

  /* eslint-disable guard-for-in,no-loop-func */
  ['createMenu',
    'buildPage'
  ].forEach(function(method) {
    it('implements ' + method + '() method', function() {
      expect((new KssBuilderBaseHandlebars())).to.respondTo(method);
    });
  });
  /* eslint-enable guard-for-in,no-loop-func */

  describe('.prepare', function() {
    before(function() {
      this.builder = testBuilder({
        destination: path.resolve(__dirname, 'output', 'base_handlebars', 'prepare'),
        builder: helperUtils.fixtures('builder-with-assets'),
        helpers: [helperUtils.fixtures('builder', 'helpers')]
      });
      return this.builder.prepare(new kss.KssStyleGuide({sections: [{header: 'Section 1', reference: 'one'}]}));
    });

    after(function() {
      return fs.removeAsync(path.resolve(__dirname, 'output', 'base_handlebars', 'prepare'));
    });

    it('stores the global Handlebars object', function() {
      expect(this.builder).to.have.property('Handlebars');
      expect(this.builder.Handlebars).to.be.object;
    });

    it('outputs settings if the verbose option is set', function() {
      let builder = testBuilder({
        helpers: ['/dev/null/example1', '/dev/null/example2'],
        verbose: true,
        // Force early prepare() failure.
        destination: null
      });
      return builder.prepare(new kss.KssStyleGuide({sections: [{header: 'Section 1', reference: 'one'}]})).catch(error => {
        let output = builder.getTestOutput('stdout');
        expect(output).to.contain('Building your KSS style guide!');
        expect(output).to.contain(' * Helpers     : /dev/null/example1, /dev/null/example2');
        return error;
      }).then(error => {
        expect(error.message).to.equal('Path must be a string. Received null');
      });
    });

    it('makes a kss-assets directory', function() {
      return fs.readdirAsync(path.resolve(__dirname, 'output', 'base_handlebars', 'prepare', 'kss-assets')).then(directoryListing => {
        expect(directoryListing).to.deep.equal(['asset1.js', 'asset2.css']);
      });
    });

    it('loads optional helpers', function() {
      expect(this.builder.Handlebars.helpers.test).to.exist;
    });

    it('compiles the Handlebars template', function() {
      expect(this.builder.template).to.be.function;
    });
  });

  describe('.build', function() {
    it('should save the KssStyleGuide');
    it('should list the files parsed and partials found if the verbose option is set'); // and inline markup
    it('should reject the Promise if there are no style guide sections');
    it('should register the partials'); // and save it to this.partials
    it('should note missing partials');
    it('should trigger buildPage() for each style guide root section');
  });

  describe('.createMenu', function() {
    it('should create a 2-level hierarchical menu');
  });

  describe('.buildPage', function() {
    it('should build a page');
    it('should add CSS files to the output');
    it('should add JS files to the output');
    it('should build the homepage given "styleGuide.homepage" as pageReference');
    it('should warn if homepage content is not found');
  });
});
