/* eslint-disable max-nested-callbacks */

'use strict';

const KssBuilderBase = require('../builder'),
  KssBuilderBaseHandlebars = require('../builder/base/handlebars'),
  mockStream = require('mock-utf8-stream');

const pathToJSON = helperUtils.fixtures('cli-option-config.json'),
  API = '3.0';

class TestKssBuilderBase extends KssBuilderBaseHandlebars {
  constructor(options) {
    super();

    options = options || {};

    if (!options.builder) {
      throw new Error('Builder must be specified for this test.');
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

describe('KssBuilderBase object API', function() {
  before(function() {
    this.files = {};
    let source = helperUtils.fixtures('source-handlebars-builder-test'),
      destination = path.resolve(__dirname, 'output', 'builder_base', 'build');
    this.builder = new TestKssBuilderBase({
      source: [
        source,
        helperUtils.fixtures('source-twig-builder-test')
      ],
      destination: destination,
      builder: helperUtils.fixtures('builder-with-assets'),
      css: ['styles-1.css', 'styles-2.css'],
      js: ['javascript-1.js', 'javascript-2.js'],
      verbose: true
    });
    return kss.traverse(source).then(styleGuide => {
      return this.builder.prepare(styleGuide);
    }).then(styleGuide => {
      return this.builder.build(styleGuide);
    }).then(() => {
      return Promise.all(
        [
          'index',
          'section-1',
          'section-2',
          'section-3'
        ].map(fileName => {
          return fs.readFileAsync(path.join(__dirname, 'output', 'builder_base', 'build', fileName + '.html'), 'utf8').then(data => {
            this.files[fileName] = data;
          });
        })
      );
    });
  });

  /* eslint-disable guard-for-in,no-loop-func */
  ['addOptions',
    'getOptions',
    'addOptionDefinitions',
    'getOptionDefinitions',
    'normalizeOptions',
    'log',
    'setLogFunction',
    'logError',
    'setLogErrorFunction',
    'clone',
    'prepare',
    'prepareDestination',
    'prepareExtend',
    'build',
    'createMenu'
  ].forEach(function(method) {
    it('has ' + method + '() method', function(done) {
      expect(new KssBuilderBase()).to.respondTo(method);
      done();
    });
  });

  ['loadBuilder'
  ].forEach(function(method) {
    it('has ' + method + '() static method', function(done) {
      expect(KssBuilderBase).itself.to.respondTo(method);
      done();
    });
  });
  /* eslint-enable guard-for-in,no-loop-func */

  describe('KssBuilderBase constructor', function() {
    it('should initialize the data', function(done) {
      let builder = new KssBuilderBase();
      expect(builder).to.have.property('options');
      expect(builder).to.have.property('optionDefinitions');
      expect(builder.API).to.equal('undefined');
      done();
    });

    it('should implement the default option definitions', function() {
      let builder = new KssBuilderBase();
      expect(Object.getOwnPropertyNames(builder.optionDefinitions)).to.deep.equal(['source', 'destination', 'json', 'mask', 'clone', 'builder', 'css', 'js', 'custom', 'extend', 'homepage', 'markup', 'placeholder', 'nav-depth', 'verbose']);
    });

    it('should set the default log function', function() {
      let builder = new KssBuilderBase();
      expect(builder.logFunction).to.deep.equal(console.log);
    });
  });

  describe('.loadBuilder()', function() {
    it('should return a Promise', function() {
      let obj = KssBuilderBase.loadBuilder(KssBuilderBase);
      return obj.catch(() => {
        expect(obj instanceof Promise).to.be.true;
      });
    });

    it('should fail if not given a KssBuilderBase class or sub-class', function() {
      return KssBuilderBase.loadBuilder({}).catch(error => {
        expect(error.message).to.equal('Unexpected value for "builder"; should be a path to a module or a JavaScript Class.');
      }).then(result => {
        expect(result).to.not.exist;
      });
    });

    it('should fail if the builder class constructor does not set the API version', function() {
      return KssBuilderBase.loadBuilder(KssBuilderBase).then(result => {
        expect(result).to.not.exist;
      }).catch(error => {
        expect(error.message).to.equal('kss expected the builder to implement KssBuilderBase API version ' + API + '; version "undefined" is being used instead.');
      });
    });

    it('should fail if the given API is not equal to the current API', function() {
      return KssBuilderBase.loadBuilder(helperUtils.fixtures('old-builder')).then(result => {
        expect(result).to.not.exist;
      }).catch(error => {
        expect(error.message).to.equal('kss expected the builder to implement KssBuilderBase API version ' + API + '; version "1.0" is being used instead.');
      });
    });

    it('should fail if the given API is newer than the current API', function() {
      return KssBuilderBase.loadBuilder(helperUtils.fixtures('newer-builder')).then(result => {
        expect(result).to.not.exist;
      }).catch(error => {
        expect(error.message).to.equal('kss expected the builder to implement KssBuilderBase API version ' + API + '; version "10.0" is being used instead.');
      });
    });

    it('should return an instance of the loaded KssBuilderBase sub-class', function() {
      let KssBuilderBaseExample = require('../builder/base/example');
      return KssBuilderBase.loadBuilder(KssBuilderBaseExample).then(result => {
        expect(result).to.be.instanceof(KssBuilderBaseExample);
      });
    });
  });

  describe('.addOptions()', function() {
    it('should set this.options', function(done) {
      let builder = new KssBuilderBase();
      builder.addOptions({aSetting: 'isSet'});
      expect(builder.options.aSetting).to.equal('isSet');
      done();
    });

    it('should not unset this.options', function(done) {
      let builder = new KssBuilderBase();
      builder.addOptions({newSetting: '../output/nested'});
      builder.addOptions({aSetting: 'isSet'});
      expect(builder.options.newSetting).to.equal('../output/nested');
      done();
    });

    it('should automatically normalize known settings', function(done) {
      let builder = new KssBuilderBase();
      builder.addOptionDefinitions((new KssBuilderBase()).optionDefinitions);
      builder.addOptions({destination: 'test/output/nested'});
      builder.addOptions({source: 'test/output/nested'});
      expect(builder.options.destination).to.equal(path.resolve('test', 'output', 'nested'));
      expect(builder.options.source).to.deep.equal([path.resolve('test', 'output', 'nested')]);
      done();
    });
  });

  describe('.getOptions()', function() {
    it('should return this.options', function(done) {
      let builder = new KssBuilderBase();
      builder.addOptions(require(pathToJSON));
      let options = builder.getOptions();
      for (let key in options) {
        if (options.hasOwnProperty(key)) {
          expect(options[key]).to.equal(builder.options[key]);
        }
      }
      done();
    });

    it('should return this.options.key given key', function(done) {
      let builder = new KssBuilderBase();
      builder.addOptions(require(pathToJSON));
      for (let key in builder.options) {
        if (builder.options.hasOwnProperty(key)) {
          expect(builder.getOptions(key)).to.equal(builder.options[key]);
        }
      }
      done();
    });
  });

  describe('.addOptionDefinitions()', function() {
    it('should add to this.optionDefinitions', function(done) {
      let builder = new KssBuilderBase();
      builder.addOptions(require(pathToJSON));
      builder.addOptionDefinitions({
        candy: {
          description: 'I want candy.'
        }
      });
      expect(builder.optionDefinitions.candy).to.exist;
      expect(builder.optionDefinitions.candy.description).to.exist;
      expect(builder.optionDefinitions.candy.multiple).to.be.true;
      expect(builder.optionDefinitions.candy.path).to.false;
      done();
    });

    it('should automatically normalize corresponding settings', function(done) {
      let builder = new KssBuilderBase();
      builder.addOptions({aSetting: 'test/output/nested'});
      expect(builder.options.aSetting).to.equal('test/output/nested');
      builder.addOptionDefinitions({
        aSetting: {
          multiple: false,
          path: true
        }
      });
      expect(builder.options.aSetting).to.equal(path.resolve('test', 'output', 'nested'));
      done();
    });
  });

  describe('.getOptionDefinitions()', function() {
    it('should return this.optionDefinitions', function(done) {
      let builder = new KssBuilderBase();
      builder.addOptionDefinitions((new KssBuilderBase()).optionDefinitions);
      let optionDefinitions = builder.getOptionDefinitions();
      for (let key in optionDefinitions) {
        if (optionDefinitions.hasOwnProperty(key)) {
          expect(optionDefinitions[key]).to.equal(builder.optionDefinitions[key]);
        }
      }
      done();
    });

    it('should return this.optionDefinitions.key given key', function(done) {
      let builder = new KssBuilderBase();
      builder.addOptionDefinitions((new KssBuilderBase()).optionDefinitions);
      for (let key in builder.optionDefinitions) {
        if (builder.optionDefinitions.hasOwnProperty(key)) {
          expect(builder.getOptionDefinitions(key)).to.equal(builder.optionDefinitions[key]);
        }
      }
      done();
    });
  });

  describe('.normalizeOptions()', function() {
    it('should normalize a "multiple" option to an array of values', function(done) {
      let builder = new KssBuilderBase();
      builder.addOptionDefinitions((new KssBuilderBase()).optionDefinitions);
      builder.addOptions({source: 'with-include'});
      builder.normalizeOptions(['source']);
      expect(builder.options.source).to.be.an.instanceOf(Array);
      builder.addOptions({source: ['with-include', 'missing-homepage']});
      builder.normalizeOptions(['source']);
      expect(builder.options.source).to.be.an.instanceOf(Array);
      // Yargs will set any option without a default to undefined.
      /* eslint-disable no-undefined */
      builder.addOptions({source: undefined});
      builder.normalizeOptions(['source']);
      expect(builder.options.source).to.be.an.instanceOf(Array);
      expect(builder.options.source.length).to.equal(0);
      done();
    });

    it('should normalize a non-"multiple" option to a single value', function(done) {
      let builder = new KssBuilderBase();
      builder.addOptionDefinitions((new KssBuilderBase()).optionDefinitions);
      builder.addOptions({builder: ['empty-source', 'with-include', 'builder']});
      builder.normalizeOptions(['builder']);
      expect(builder.options.builder).to.be.a('string');
      done();
    });

    it('should resolve paths relative to the current working directory', function(done) {
      let builder = new KssBuilderBase();
      builder.addOptions(require(pathToJSON));
      builder.addOptionDefinitions((new KssBuilderBase()).optionDefinitions);
      builder.normalizeOptions(['source']);
      expect(builder.options.source[0]).to.equal(path.resolve('with-include'));
      done();
    });

    it('should not try to resolve a null path', function(done) {
      let builder = new KssBuilderBase();
      builder.addOptions(require(pathToJSON));
      builder.addOptions({destination: null});
      builder.normalizeOptions(['destination']);
      expect(builder.options.destination).to.equal(null);
      done();
    });
  });

  describe('.log()', function() {
    it('should log the given message', function() {
      let loggedMessages = [],
        logFunction = function() {
          for (let i = 0; i < arguments.length; i++) {
            loggedMessages.push(arguments[i]);
          }
        };
      let builder = new KssBuilderBase();
      builder.setLogFunction(logFunction);
      builder.log('test', 'message');
      expect(loggedMessages).to.deep.equal(['test', 'message']);
    });
  });

  describe('.setLogFunction()', function() {
    it('should set the log function to use', function() {
      let loggedMessages = [],
        logFunction = function() {
          for (let i = 0; i < arguments.length; i++) {
            loggedMessages.push(arguments[i]);
          }
        };
      let builder = new KssBuilderBase();
      builder.setLogFunction(logFunction);
      expect(builder.logFunction).to.deep.equal(logFunction);
    });
  });

  describe('.logError()', function() {
    it('should log the given error', function() {
      let loggedErrors = [],
        logErrorFunction = function(error) {
          loggedErrors.push(error);
        };
      let builder = new KssBuilderBase();
      builder.setLogErrorFunction(logErrorFunction);
      builder.logError(new Error('test1'));
      builder.logError(new Error('test2'));
      expect(loggedErrors).to.deep.equal([new Error('test1'), new Error('test2')]);
    });
  });

  describe('.setLogErrorFunction()', function() {
    it('should set the log error function to use', function() {
      let loggedErrors = [],
        logErrorFunction = function(error) {
          loggedErrors.push(error);
        };
      let builder = new KssBuilderBase();
      builder.setLogErrorFunction(logErrorFunction);
      expect(builder.logErrorFunction).to.deep.equal(logErrorFunction);
    });
  });

  describe('.clone()', function() {
    it('should clone the given directory to the given destination', function() {
      let destination = helperUtils.fixtures('..', 'output', 'clone'),
        builder = new KssBuilderBase();
      return builder.clone(helperUtils.fixtures('builder'), destination).catch(error => {
        expect(error).to.not.exist;
      }).then(result => {
        expect(result).to.be.undefined;
        return fs.removeAsync(destination);
      });
    });

    it('should fail to clone if the given destination exists', function() {
      let builder = new KssBuilderBase();
      return builder.clone(helperUtils.fixtures('builder'), helperUtils.fixtures('traverse-directories')).then(result => {
        expect(result).to.not.be.undefined;
      }).catch(error => {
        expect(error.message).to.equal('This folder already exists: ' + helperUtils.fixtures('traverse-directories'));
      });
    });

    it('should skip node_modules and dot-hidden paths', function() {
      let destination = helperUtils.fixtures('..', 'output', 'clone-skip'),
        builder = new KssBuilderBase();
      return builder.clone(helperUtils.fixtures('builder'), destination).then(() => {
        return fs.readdirAsync(destination);
      }).then(files => {
        // Check for node_modules folder.
        expect(files.find(value => { return value === 'node_modules'; })).to.be.undefined;
        // Check for .svn folder.
        expect(files.find(value => { return value === '.svn'; })).to.be.undefined;
        return fs.removeAsync(destination);
      }).catch(error => {
        expect(error).to.not.exist;
      });
    });
  });

  describe('.prepare()', function() {
    it('should return a promise resolving to the KssStyleGuide given to it', function() {
      let builder = new KssBuilderBase(),
        styleGuide = new kss.KssStyleGuide({sections: [{header: 'Section', reference: '1.1'}]});
      let obj = builder.prepare(styleGuide);
      return obj.then((result) => {
        expect(obj instanceof Promise).to.be.true;
        expect(result).to.deep.equal(styleGuide);
      });
    });

    it('should report an error if no KSS sections are found', function() {
      let builder = new KssBuilderBase(),
        styleGuide = new kss.KssStyleGuide();
      return builder.prepare(styleGuide).then(result => {
        expect(result).to.not.exist;
      }).catch(error => {
        expect(error.message).to.equal('No KSS documentation discovered in source files.');
      });
    });

    it('should add missing sections to the style guide', function() {
      let builder = new KssBuilderBase(),
        styleGuide1 = new kss.KssStyleGuide({sections: [
          {header: 'Section C', reference: 'a.b.c'}
        ]}),
        styleGuide2 = new kss.KssStyleGuide({sections: [
          {header: 'Section C', reference: 'a - b - c'}
        ]});
      return builder.prepare(styleGuide1).then((result) => {
        expect(result).to.deep.equal(styleGuide1);
        expect(result.sections().length).to.equal(3);
        expect(result.sections().map(section => { return section.reference(); })).to.deep.equal(['a', 'a.b', 'a.b.c']);
        return builder.prepare(styleGuide2).then((result) => {
          expect(result).to.deep.equal(styleGuide2);
          expect(result.sections().length).to.equal(3);
          expect(result.sections().map(section => { return section.reference(); })).to.deep.equal(['a', 'a - b', 'a - b - c']);
        });
      });
    });
  });

  describe('.prepareDestination()', function() {
    before(function() {
      let builder = new KssBuilderBase();
      this.destination = helperUtils.fixtures('..', 'output', 'prepare-destination');
      builder.addOptions({
        destination: this.destination,
        builder: helperUtils.fixtures('builder')
      });
      return builder.prepareDestination('assets').then(() => {
        return fs.readdirAsync(this.destination);
      }).then(files => {
        this.destinationListing = files;
      }).catch(error => {
        this.destinationError = error;
        return Promise.resolve();
      });
    });

    after(function() {
      return fs.removeAsync(this.destination);
    });

    it('should make a destination directory', function(done) {
      expect(this.destinationError).to.not.exist;
      done();
    });

    it('should make an asset directory', function(done) {
      expect(this.destinationListing.find(value => { return value === 'assets'; })).to.exist;
      done();
    });

    it('should copy the contents of the asset directory', function() {
      return fs.readdirAsync(path.resolve(this.destination, 'assets')).then(directoryListing => {
        expect(directoryListing).to.deep.equal(['SHOULD_NOT_SKIP']);
      });
    });

    it('should skip any dot directories in the asset directory', function(done) {
      // Check for .svn folder.
      expect(this.destinationListing.find(value => { return value === '.svn'; })).to.be.undefined;
      done();
    });

    it('should skip any node_modules directory in the asset directory', function(done) {
      // Check for node_modules folder.
      expect(this.destinationListing.find(value => { return value === 'node_modules'; })).to.be.undefined;
      done();
    });

    it('should not fail when the asset directory does not exist', function() {
      let destination = helperUtils.fixtures('..', 'output', 'prepare-destination-2'),
        builder = new KssBuilderBase();
      builder.addOptions({
        destination: destination,
        builder: helperUtils.fixtures('builder')
      });
      return builder.prepareDestination('no-assets').then(() => {
        return fs.readdirAsync(destination);
      }).then(files => {
        expect(files.find(value => { return value === 'assets'; })).to.be.undefined;
        expect(files.find(value => { return value === 'no-assets'; })).to.be.undefined;
        return fs.removeAsync(destination);
      });
    });

    it('should not copy an asset directory by default', function() {
      let destination = helperUtils.fixtures('..', 'output', 'prepare-destination-3'),
        builder = new KssBuilderBase();
      builder.addOptions({
        destination: destination,
        builder: helperUtils.fixtures('builder')
      });
      return builder.prepareDestination().then(() => {
        return fs.readdirAsync(destination);
      }).then(files => {
        expect(files.find(value => { return value === 'assets'; })).to.be.undefined;
        return fs.removeAsync(destination);
      });
    });
  });

  describe('.prepareExtend()', function() {
    before(function() {
      let builder = new KssBuilderBase();
      builder.addOptions({
        optionForExtend1: 'option for extend 1',
        extend: [
          helperUtils.fixtures('extend'),
          helperUtils.fixtures('extend2')
        ]
      });
      this.templateEngine = {
        engine: true
      };
      return builder.prepareExtend(this.templateEngine);
    });

    it('should ignore non .js files in extend directories', function(done) {
      expect(this.templateEngine.ignore).to.not.exist;
      done();
    });

    it('should require all .js files', function(done) {
      expect(this.templateEngine.extend1).to.exist;
      expect(this.templateEngine.extend2).to.be.true;
      expect(this.templateEngine.extend3).to.be.true;
      done();
    });

    it('should ignore .js files that do not export a function', function(done) {
      expect(this.templateEngine.nonFunction).to.not.exist;
      done();
    });

    it('should pass the templating system object to the exported function', function(done) {
      expect(this.templateEngine.extend1).to.exist;
      done();
    });

    it('should pass the builder options to the exported function', function(done) {
      expect(this.templateEngine.extend1).to.deep.equal({fromOptions: 'option for extend 1'});
      done();
    });
  });

  describe('.build()', function() {
    it('should return the style guide given to it', function() {
      let builder = new KssBuilderBase(),
        styleGuide = new kss.KssStyleGuide({sections: [{header: 'Section', reference: '1.1'}]});
      return builder.build(styleGuide).then((result) => {
        expect(result).to.deep.equal(styleGuide);
      });
    });
  });

  describe('.buildGuide', function() {
    it('should load the templates using options.readBuilderTemplate', function() {
      let builder = new KssBuilderBase(),
        options = {
          readBuilderTemplate: function(template) {
            let templateFunction;
            if (template === 'index') {
              templateFunction = function() { return 'mockIndexTemplate'; };
            } else if (template === 'section') {
              templateFunction = function() { return 'mockSectionTemplate'; };
            } else if (template === 'item') {
              templateFunction = function() { return 'mockItemTemplate'; };
            }
            return Promise.resolve(templateFunction);
          },
          readSectionTemplate: '',
          loadInlineTemplate: '',
          loadContext: '',
          getTemplate: '',
          templateRender: '',
          filenameToTemplateRef: '',
          templateExtension: '',
          emptyTemplate: ''
        };
      builder.buildPage = () => { return Promise.resolve(); };
      return builder.buildGuide(new kss.KssStyleGuide({}), options).catch(error => {
        return error;
      }).then(() => {
        expect(builder.templates.index).to.be.function;
        expect(builder.templates.section).to.be.function;
        expect(builder.templates.item).to.be.function;
        expect(builder.templates.index()).to.equal('mockIndexTemplate');
        expect(builder.templates.section()).to.equal('mockSectionTemplate');
        expect(builder.templates.item()).to.equal('mockItemTemplate');
      });
    });

    it('should use the index template when no section or item template', function() {
      let builder = new KssBuilderBase(),
        options = {
          readBuilderTemplate: function(name) {
            if (name === 'index') {
              return Promise.resolve(function() { return 'mockIndexTemplate'; });
            } else {
              return Promise.reject(new Error('no template'));
            }
          },
          readSectionTemplate: '',
          loadInlineTemplate: '',
          loadContext: '',
          getTemplate: '',
          templateRender: '',
          filenameToTemplateRef: '',
          templateExtension: '',
          emptyTemplate: ''
        };
      builder.buildPage = () => { return Promise.resolve(); };
      return builder.buildGuide(new kss.KssStyleGuide({}), options).catch(error => {
        return error;
      }).then(() => {
        expect(builder.templates.index).to.be.function;
        expect(builder.templates.section).to.be.function;
        expect(builder.templates.item).to.be.function;
        expect(builder.templates.index()).to.equal('mockIndexTemplate');
        expect(builder.templates.section()).to.equal('mockIndexTemplate');
        expect(builder.templates.item()).to.equal('mockIndexTemplate');
      });
    });

    it('should save the KssStyleGuide', function() {
      let styleGuide = new kss.KssStyleGuide({
        sections: [
          {header: 'Section A'},
          {header: 'Section B'}
        ]
      });
      let builder = new KssBuilderBase();
      builder.templates = {
        index: '',
        section: '',
        item: ''
      };
      builder.buildPage = () => { return Promise.resolve(); };
      return builder.buildGuide(styleGuide, {}).catch(error => {
        return error;
      }).then(() => {
        expect(builder.styleGuide).to.deep.equal(styleGuide);
      });
    });

    it('should list the files parsed if the verbose option is set', function() {
      let stdout = this.builder.getTestOutput('stdout');
      expect(stdout).to.include(' - ' + helperUtils.fixtures('source-handlebars-builder-test/kss-source.scss'));
      expect(stdout).to.include(' - ' + helperUtils.fixtures('source-handlebars-builder-test/kss-source-3.scss'));
    });

    it('should list the section templates found if the verbose option is set', function() {
      let stdout = this.builder.getTestOutput('stdout');
      expect(stdout).to.include(' - 1.B: inline markup');
      expect(stdout).to.include(' - 1.E: inline markup');
      expect(stdout).to.include(' - 1.C: 1c.hbs');
      expect(stdout).to.include(' - 1.C.A: 1ca.hbs');
    });

    it('should register the section templates', function() {
      expect(Object.keys(this.builder.sectionTemplates).sort()).to.deep.equal(['1.B', '1.C', '1.C.A', '1.C.B', '1.C.C', '1.D', '1.E']);
    });

    it('should note missing section templates', function() {
      let stdout = this.builder.getTestOutput('stdout');
      expect(stdout).to.include(' - 1.D: missing-file.hbs NOT FOUND!');

      let builder = new TestKssBuilderBase({
        source: helperUtils.fixtures('source-handlebars-builder-test'),
        destination: path.resolve(__dirname, 'output', 'base_handlebars', 'build-no-verbose'),
        builder: helperUtils.fixtures('builder-with-assets'),
        extend: helperUtils.fixtures('builder-with-assets', 'extend')
      });
      let styleGuide = new kss.KssStyleGuide({sections: [{header: 'Heading 4.3', reference: '4.3', markup: '4.3.hbs'}]});
      return builder.prepare(styleGuide).then(styleGuide => {
        return builder.build(styleGuide);
      }).then(() => {
        expect(builder.getTestOutput('stdout')).to.include('WARNING: In section 4.3, 4.3.hbs NOT FOUND!');
      });
    });

    it('should trigger buildPage() for each style guide root section', function() {
      let stdout = this.builder.getTestOutput('stdout');
      expect(stdout).to.include(' - section 1 [1]');
      expect(stdout).to.include(' - section 2 [2]');
      expect(stdout).to.include(' - section 3 [Heading 3]');
      expect(stdout).to.include(' - homepage');
    });
  });

  describe('.buildPage', function() {
    it('should build a page', function() {
      expect(this.files['section-1']).to.include('<meta name="generator" content="kss-node" />');
      expect(this.files['section-2']).to.include('<meta name="generator" content="kss-node" />');
      expect(this.files['section-3']).to.include('<meta name="generator" content="kss-node" />');
    });

    it('should render the kss-example-* template', function() {
      expect(this.files['section-1']).to.include('<h1>Example 1c</h1>');
    });

    it('should add placeholder to modifier_class', function() {
      expect(this.files['section-1']).to.include('ref:1.E:markup:&lt;div class&#x3D;&quot;[modifier class]&quot;&gt;&lt;/div&gt;');
    });

    it('should add modifier_class from the JSON data', function() {
      expect(this.files['section-1']).to.include('ref:1.C.B:example:<div class="one-cee-bee-from-json">');
      expect(this.files['section-1']).to.include('ref:1.C.B:markup:&lt;div class&#x3D;&quot;one-cee-bee-from-json [modifier class]&quot;&gt;');
    });

    it('should add modifier_class from the example JSON data', function() {
      expect(this.files['section-1']).to.include('ref:1.C:modifier:modifier-1:markup:<div class="one-cee-example-from-json modifier-1">');
    });

    it('should add modifier_class from the modifier\'s className property', function() {
      expect(this.files['section-1']).to.include('ref:1.E:modifier:modifier-1:markup:<div class="modifier-1"></div>');
      expect(this.files['section-1']).to.include('ref:1.E:modifier:pseudo-class-hover:markup:<div class="pseudo-class-hover"></div>');
    });

    it('should add modifier_class from the placeholder option if used on section', function() {
      expect(this.files['section-1']).to.include('ref:1.E:markup:&lt;div class&#x3D;&quot;[modifier class]&quot;&gt;&lt;/div&gt;');
    });

    it('should add CSS files to the output', function() {
      expect(this.files['index']).to.include('<link rel="stylesheet" href="styles-1.css">');
      expect(this.files['index']).to.include('<link rel="stylesheet" href="styles-2.css">');
    });

    it('should add JS files to the output', function() {
      expect(this.files['index']).to.include('<script src="javascript-1.js"></script>');
      expect(this.files['index']).to.include('<script src="javascript-2.js"></script>');
    });

    it('should build the homepage given "index" as templateName', function() {
      expect(this.files['index']).to.include('<meta name="generator" content="kss-node" />');

      let builder = new TestKssBuilderBase({
        source: helperUtils.fixtures('source-handlebars-builder-test'),
        destination: path.resolve(__dirname, 'output', 'builder_base', 'buildPage'),
        builder: helperUtils.fixtures('builder-with-assets'),
        homepage: 'alternate-homepage.md'
      });
      let styleGuide = new kss.KssStyleGuide({sections: [{header: 'Heading 4.3', reference: '4.3'}]});
      return builder.prepare(styleGuide).then(styleGuide => {
        // Instead of running builder.build(), we do 2 of its tasks manually:
        // - save the style guide
        // - compile the Handlebars template
        builder.styleGuide = styleGuide;
        return fs.readFileAsync(path.resolve(builder.options.builder, 'index.hbs'), 'utf8');
      }).then(content => {
        builder.templates = {};
        builder.templates.index = builder.Handlebars.compile(content);
        let options = {};

        // Returns a promise to get a template by name.
        options.getTemplate = name => {
          // We don't wrap the rendered template in "new handlebars.SafeString()"
          // since we want the ability to display it as a code sample with {{ }} and
          // as rendered HTML with {{{ }}}.
          return Promise.resolve(builder.Handlebars.compile('{{> "' + name + '"}}'));
        };
        // Renders a template and returns the markup.
        options.templateRender = (template, context) => {
          return template(context);
        };

        // Now generate the homepage to test this method directly.
        return builder.buildPage('index', options, null, []);
      }).then(() => {
        return fs.readFileAsync(path.join(__dirname, 'output', 'builder_base', 'buildPage', 'index.html'), 'utf8');
      }).then(homepageContent => {
        expect(builder.getTestOutput('stdout')).to.not.include('WARNING: no homepage content found in ' + builder.options.homepage + '.');
        expect(homepageContent).to.include('<p>This is the homepage text from the &quot;alternate-homepage.md&quot; file.</p>');
      });
    });

    it('should warn if homepage content is not found', function() {
      let stdout = this.builder.getTestOutput('stdout');
      expect(stdout).to.include('   ...no homepage content found in homepage.md');
    });
  });

  describe('.createMenu', function() {
    before(function() {
      this.styleGuide = new kss.KssStyleGuide({sections: [
        {header: 'Header 1', reference: '1'},
        {header: 'Header 1.E', reference: '1.E'},
        {header: 'Header 1.E.A', reference: '1.E.A'},
        {header: 'Header 1.E.A.A', reference: '1.E.A.A'},
        {header: 'Header 2', reference: '2'},
        {header: 'Header 2.A', reference: '2.A'},
        {header: 'Header 3', reference: '3'}
      ]});
    });

    it('should create a 2-level hierarchical menu', function(done) {
      let builder = new KssBuilderBase(),
        menu;
      builder.styleGuide = this.styleGuide;
      builder.addOptions({'nav-depth': 4});
      menu = builder.createMenu('1');
      expect(menu.length, 'menu.length').to.equal(3);

      expect(menu[0].header).to.equal('Header 1');
      expect(menu[0].isActive, 'menu[0].isActive').to.be.true;
      expect(menu[0].isGrandChild, 'menu[0].isGrandChild').to.be.false;
      expect(menu[0].children.length, 'menu[0].children.length').to.equal(3);

      expect(menu[0].children[0].header).to.equal('Header 1.E');
      expect(menu[0].children[0].isActive, 'menu[0].children[0].isActive').to.be.false;
      expect(menu[0].children[0].isGrandChild, 'menu[0].children[0].isGrandChild').to.be.false;

      expect(menu[0].children[1].header).to.equal('Header 1.E.A');
      expect(menu[0].children[1].isActive, 'menu[0].children[1].isActive').to.be.false;
      expect(menu[0].children[1].isGrandChild, 'menu[0].children[1].isGrandChild').to.be.true;

      expect(menu[0].children[2].header).to.equal('Header 1.E.A.A');
      expect(menu[0].children[2].isActive, 'menu[0].children[1].isActive').to.be.false;
      expect(menu[0].children[2].isGrandChild, 'menu[0].children[1].isGrandChild').to.be.true;

      expect(menu[1].header).to.equal('Header 2');
      expect(menu[1].isActive, 'menu[1].isActive').to.be.false;
      expect(menu[1].isGrandChild, 'menu[1].isGrandChild').to.be.false;
      expect(menu[1].children.length, 'menu[1].children.length').to.equal(1);

      expect(menu[1].children[0].header).to.equal('Header 2.A');
      expect(menu[1].children[0].isActive, 'menu[1].children[0].isActive').to.be.false;
      expect(menu[1].children[0].isGrandChild, 'menu[1].children[0].isGrandChild').to.be.false;

      expect(menu[2].header).to.equal('Header 3');
      expect(menu[2].isActive, 'menu[2].isActive').to.be.false;
      expect(menu[2].isGrandChild, 'menu[2].isGrandChild').to.be.false;
      expect(menu[2].children.length, 'menu[2].children.length').to.equal(0);

      done();
    });

    it('should mark the specified root as active', function(done) {
      let builder = new KssBuilderBase(),
        menu;
      builder.styleGuide = this.styleGuide;
      menu = builder.createMenu('2');

      expect(menu[0].header).to.equal('Header 1');
      expect(menu[0].isActive, 'menu[0].isActive').to.be.false;
      expect(menu[1].header).to.equal('Header 2');
      expect(menu[1].isActive, 'menu[1].isActive').to.be.true;
      expect(menu[2].header).to.equal('Header 3');
      expect(menu[2].isActive, 'menu[2].isActive').to.be.false;
      done();
    });

    it('should limit the depth of the menu to 2 by default', function(done) {
      let builder = new KssBuilderBase(),
        menu;
      builder.styleGuide = this.styleGuide;
      menu = builder.createMenu('1');

      expect(menu.length, 'menu.length').to.equal(3);
      expect(menu[0].children.length).to.equal(2);
      expect(menu[0].children[0].header).to.equal('Header 1.E');
      expect(menu[0].children[1].header).to.equal('Header 1.E.A');
      done();
    });

    it('should limit the depth of the menu to the specified depth', function(done) {
      let builder = new KssBuilderBase(),
        menu;
      builder.styleGuide = this.styleGuide;
      builder.addOptions({'nav-depth': 2});
      menu = builder.createMenu('1');

      expect(menu.length, 'menu.length').to.equal(3);
      expect(menu[0].children.length).to.equal(1);
      expect(menu[0].children[0].header).to.equal('Header 1.E');
      done();
    });
  });
});
