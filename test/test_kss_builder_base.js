/* eslint-disable max-nested-callbacks */

'use strict';

const KssBuilderBase = require('../builder');

const pathToJSON = helperUtils.fixtures('cli-option-config.json'),
  API = '3.0';

describe('KssBuilderBase object API', function() {
  /* eslint-disable guard-for-in,no-loop-func */
  ['addConfig',
    'getConfig',
    'addOptionDefinitions',
    'getOptionDefinitions',
    'normalizeOptions',
    'log',
    'setLogFunction',
    'clone',
    'init',
    'prepare',
    'build'
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
      expect(builder).to.have.property('config');
      expect(builder).to.have.property('optionDefinitions');
      expect(builder.API).to.equal('undefined');
      done();
    });

    it('should implement the default option definitions', function() {
      let builder = new KssBuilderBase();
      expect(Object.getOwnPropertyNames(builder.optionDefinitions)).to.deep.equal(['source', 'destination', 'mask', 'clone', 'builder', 'css', 'js', 'custom', 'verbose']);
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
        expect(error.message).to.equal('kss-node expected the builder to implement KssBuilderBase API version ' + API + '; version "undefined" is being used instead.');
      });
    });

    it('should fail if the given API is not equal to the current API', function() {
      return KssBuilderBase.loadBuilder(helperUtils.fixtures('old-builder')).then(result => {
        expect(result).to.not.exist;
      }).catch(error => {
        expect(error.message).to.equal('kss-node expected the builder to implement KssBuilderBase API version ' + API + '; version "1.0" is being used instead.');
      });
    });

    it('should fail if the given API is newer than the current API', function() {
      return KssBuilderBase.loadBuilder(helperUtils.fixtures('newer-builder')).then(result => {
        expect(result).to.not.exist;
      }).catch(error => {
        expect(error.message).to.equal('kss-node expected the builder to implement KssBuilderBase API version ' + API + '; version "10.0" is being used instead.');
      });
    });
  });

  describe('.addConfig()', function() {
    it('should set this.config', function(done) {
      let builder = new KssBuilderBase();
      builder.addConfig({aSetting: 'isSet'});
      expect(builder.config.aSetting).to.equal('isSet');
      done();
    });

    it('should not unset this.config', function(done) {
      let builder = new KssBuilderBase();
      builder.addConfig({newSetting: '../output/nested'});
      builder.addConfig({aSetting: 'isSet'});
      expect(builder.config.newSetting).to.equal('../output/nested');
      done();
    });

    it('should automatically normalize known settings', function(done) {
      let builder = new KssBuilderBase();
      builder.addOptionDefinitions((new KssBuilderBase()).optionDefinitions);
      builder.addConfig({destination: 'test/output/nested'});
      builder.addConfig({source: 'test/output/nested'});
      expect(builder.config.destination).to.equal(path.resolve('test', 'output', 'nested'));
      expect(builder.config.source).to.deep.equal([path.resolve('test', 'output', 'nested')]);
      done();
    });
  });

  describe('.getConfig()', function() {
    it('should return this.config', function(done) {
      let builder = new KssBuilderBase();
      builder.addConfig(require(pathToJSON));
      let config = builder.getConfig();
      for (let key in config) {
        if (config.hasOwnProperty(key)) {
          expect(config[key]).to.equal(builder.config[key]);
        }
      }
      done();
    });

    it('should return this.config.key given key', function(done) {
      let builder = new KssBuilderBase();
      builder.addConfig(require(pathToJSON));
      for (let key in builder.config) {
        if (builder.config.hasOwnProperty(key)) {
          expect(builder.getConfig(key)).to.equal(builder.config[key]);
        }
      }
      done();
    });
  });

  describe('.addOptionDefinitions()', function() {
    it('should add to this.optionDefinitions', function(done) {
      let builder = new KssBuilderBase();
      builder.addConfig(require(pathToJSON));
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
      builder.addConfig({aSetting: 'test/output/nested'});
      expect(builder.config.aSetting).to.equal('test/output/nested');
      builder.addOptionDefinitions({
        aSetting: {
          multiple: false,
          path: true
        }
      });
      expect(builder.config.aSetting).to.equal(path.resolve('test', 'output', 'nested'));
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
      builder.addConfig({source: 'with-include'});
      builder.normalizeOptions(['source']);
      expect(builder.config.source).to.be.an.instanceOf(Array);
      builder.addConfig({source: ['with-include', 'missing-homepage']});
      builder.normalizeOptions(['source']);
      expect(builder.config.source).to.be.an.instanceOf(Array);
      // Yargs will set any option without a default to undefined.
      /* eslint-disable no-undefined */
      builder.addConfig({source: undefined});
      builder.normalizeOptions(['source']);
      expect(builder.config.source).to.be.an.instanceOf(Array);
      expect(builder.config.source.length).to.equal(0);
      done();
    });

    it('should normalize a non-"multiple" option to a single value', function(done) {
      let builder = new KssBuilderBase();
      builder.addOptionDefinitions((new KssBuilderBase()).optionDefinitions);
      builder.addConfig({builder: ['empty-source', 'with-include', 'builder']});
      builder.normalizeOptions(['builder']);
      expect(builder.config.builder).to.be.a('string');
      done();
    });

    it('should resolve paths relative to the current working directory', function(done) {
      let builder = new KssBuilderBase();
      builder.addConfig(require(pathToJSON));
      builder.addOptionDefinitions((new KssBuilderBase()).optionDefinitions);
      builder.normalizeOptions(['source']);
      expect(builder.config.source[0]).to.equal(path.resolve('with-include'));
      done();
    });

    it('should not try to resolve a null path', function(done) {
      let builder = new KssBuilderBase();
      builder.addConfig(require(pathToJSON));
      builder.addConfig({destination: null});
      builder.normalizeOptions(['destination']);
      expect(builder.config.destination).to.equal(null);
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
      return builder.clone(helperUtils.fixtures('builder'), helperUtils.fixtures('includes')).then(result => {
        expect(result).to.not.be.undefined;
      }).catch(error => {
        expect(error.message).to.equal('This folder already exists: ' + helperUtils.fixtures('includes'));
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

  describe('.init()', function() {
    it('should return a Promise', function() {
      let obj = (new KssBuilderBase()).init();
      return obj.then(() => {
        expect(obj instanceof Promise).to.be.true;
      });
    });
  });

  describe('.prepare()', function() {
    it('should return the style guide given to it', function() {
      let builder = new KssBuilderBase(),
        styleGuide = new kss.KssStyleGuide({sections: [{header: 'Section', reference: '1.1'}]});
      return builder.prepare(styleGuide).then((result) => {
        expect(result).to.deep.equal(styleGuide);
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

  describe('.build()', function() {
    it('should return the style guide given to it', function() {
      let builder = new KssBuilderBase(),
        styleGuide = new kss.KssStyleGuide({sections: [{header: 'Section', reference: '1.1'}]});
      return builder.build(styleGuide).then((result) => {
        expect(result).to.deep.equal(styleGuide);
      });
    });
  });
});
