/* eslint-disable max-nested-callbacks */

'use strict';

const KssBuilder = require('../builder'),
  Promise = require('bluebird');

const fs = Promise.promisifyAll(require('fs-extra'));

const pathToJSON = helperUtils.fixtures('cli-option-config.json'),
  API = '3.0';

describe('KssBuilder object API', function() {
  /* eslint-disable guard-for-in,no-loop-func */
  ['addConfig',
    'getConfig',
    'addOptions',
    'getOptions',
    'normalizeConfig',
    'log',
    'setLogFunction',
    'clone',
    'init',
    'prepare',
    'build'
  ].forEach(function(method) {
    it('has ' + method + '() method', function(done) {
      expect(new KssBuilder({})).to.respondTo(method);
      done();
    });
  });

  ['checkBuilder'
  ].forEach(function(method) {
    it('has ' + method + '() static method', function(done) {
      expect(KssBuilder).itself.to.respondTo(method);
      done();
    });
  });
  /* eslint-enable guard-for-in,no-loop-func */

  describe('KssBuilder constructor', function() {
    it('should initialize the data', function(done) {
      let builder = new KssBuilder();
      expect(builder).to.have.property('config');
      expect(builder).to.have.property('options');
      expect(builder.API).to.equal('undefined');
      done();
    });

    it('should implement the default options', function() {
      let builder = new KssBuilder();
      expect(Object.getOwnPropertyNames(builder.options)).to.deep.equal(['source', 'destination', 'mask', 'clone', 'builder', 'css', 'js', 'custom', 'verbose']);
    });

    it('should set the given options', function() {
      let options = {
        custom: {option: 1},
        custom2: {option: 2}
      };
      let builder = new KssBuilder(options);
      expect(builder.options.custom).to.deep.equal(options.custom);
      expect(builder.options.custom2).to.deep.equal(options.custom2);
    });

    it('should set the default log function', function() {
      let builder = new KssBuilder();
      expect(builder.logFunction).to.deep.equal(console.log);
    });
  });

  describe('.checkBuilder()', function() {
    it('should return a Promise', function() {
      let builder = new KssBuilder();
      let obj = KssBuilder.checkBuilder(builder);
      return obj.catch(() => {
        expect(obj instanceof Promise).to.be.true;
      });
    });

    it('should fail if the API is not given to the constructor', function() {
      let builder = new KssBuilder();
      return KssBuilder.checkBuilder(builder).then(result => {
        expect(result).to.not.exist;
      }).catch(error => {
        expect(error.message).to.equal('kss-node expected the builder to implement KssBuilder API version ' + API + '; version "undefined" is being used instead.');
      });
    });

    it('should fail if the given API is not equal to the current API', function() {
      let builder = new KssBuilder();
      builder.API = '2.0';
      return KssBuilder.checkBuilder(builder).then(result => {
        expect(result).to.not.exist;
      }).catch(error => {
        expect(error.message).to.equal('kss-node expected the builder to implement KssBuilder API version ' + API + '; version "2.0" is being used instead.');
      });
    });

    it('should fail if the given API is newer than the current API', function() {
      let builder = new KssBuilder();
      builder.API = '3.999';
      return KssBuilder.checkBuilder(builder).then(result => {
        expect(result).to.not.exist;
      }).catch(error => {
        expect(error.message).to.equal('kss-node expected the builder to implement KssBuilder API version ' + API + '; version "3.999" is being used instead.');
      });
    });
  });

  describe('.addConfig()', function() {
    it('should set this.config', function(done) {
      let builder = new KssBuilder();
      builder.addConfig({aSetting: 'isSet'});
      expect(builder.config.aSetting).to.equal('isSet');
      done();
    });

    it('should not unset this.config', function(done) {
      let builder = new KssBuilder();
      builder.addConfig({newSetting: '../output/nested'});
      builder.addConfig({aSetting: 'isSet'});
      expect(builder.config.newSetting).to.equal('../output/nested');
      done();
    });

    it('should automatically normalize known settings', function(done) {
      let builder = new KssBuilder();
      builder.addOptions((new KssBuilder()).options);
      builder.addConfig({destination: 'test/output/nested'});
      builder.addConfig({source: 'test/output/nested'});
      expect(builder.config.destination).to.equal(path.resolve('test', 'output', 'nested'));
      expect(builder.config.source).to.deep.equal([path.resolve('test', 'output', 'nested')]);
      done();
    });
  });

  describe('.getConfig()', function() {
    it('should return this.config', function(done) {
      let builder = new KssBuilder();
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
      let builder = new KssBuilder();
      builder.addConfig(require(pathToJSON));
      for (let key in builder.config) {
        if (builder.config.hasOwnProperty(key)) {
          expect(builder.getConfig(key)).to.equal(builder.config[key]);
        }
      }
      done();
    });
  });

  describe('.addOptions()', function() {
    it('should add to this.options', function(done) {
      let builder = new KssBuilder();
      builder.addConfig(require(pathToJSON));
      builder.addOptions({
        candy: {
          description: 'I want candy.'
        }
      });
      expect(builder.options.candy).to.exist;
      expect(builder.options.candy.description).to.exist;
      expect(builder.options.candy.multiple).to.be.true;
      expect(builder.options.candy.path).to.false;
      done();
    });

    it('should automatically normalize corresponding settings', function(done) {
      let builder = new KssBuilder();
      builder.addConfig({aSetting: 'test/output/nested'});
      expect(builder.config.aSetting).to.equal('test/output/nested');
      builder.addOptions({
        aSetting: {
          multiple: false,
          path: true
        }
      });
      expect(builder.config.aSetting).to.equal(path.resolve('test', 'output', 'nested'));
      done();
    });
  });

  describe('.getOptions()', function() {
    it('should return this.options', function(done) {
      let builder = new KssBuilder();
      builder.addOptions((new KssBuilder()).options);
      let options = builder.getOptions();
      for (let key in options) {
        if (options.hasOwnProperty(key)) {
          expect(options[key]).to.equal(builder.options[key]);
        }
      }
      done();
    });

    it('should return this.options.key given key', function(done) {
      let builder = new KssBuilder();
      builder.addOptions((new KssBuilder()).options);
      for (let key in builder.options) {
        if (builder.options.hasOwnProperty(key)) {
          expect(builder.getOptions(key)).to.equal(builder.options[key]);
        }
      }
      done();
    });
  });

  describe('.normalizeConfig()', function() {
    it('should normalize a "multiple" option to an array of values', function(done) {
      let builder = new KssBuilder();
      builder.addOptions((new KssBuilder()).options);
      builder.addConfig({source: 'with-include'});
      builder.normalizeConfig(['source']);
      expect(builder.config.source).to.be.an.instanceOf(Array);
      builder.addConfig({source: ['with-include', 'missing-homepage']});
      builder.normalizeConfig(['source']);
      expect(builder.config.source).to.be.an.instanceOf(Array);
      // Yargs will set any option without a default to undefined.
      /* eslint-disable no-undefined */
      builder.addConfig({source: undefined});
      builder.normalizeConfig(['source']);
      expect(builder.config.source).to.be.an.instanceOf(Array);
      expect(builder.config.source.length).to.equal(0);
      done();
    });

    it('should normalize a non-"multiple" option to a single value', function(done) {
      let builder = new KssBuilder();
      builder.addOptions((new KssBuilder()).options);
      builder.addConfig({builder: ['empty-source', 'with-include', 'builder']});
      builder.normalizeConfig(['builder']);
      expect(builder.config.builder).to.be.a('string');
      done();
    });

    it('should resolve paths relative to the current working directory', function(done) {
      let builder = new KssBuilder();
      builder.addConfig(require(pathToJSON));
      builder.addOptions((new KssBuilder()).options);
      builder.normalizeConfig(['source']);
      expect(builder.config.source[0]).to.equal(path.resolve('with-include'));
      done();
    });

    it('should not try to resolve a null path', function(done) {
      let builder = new KssBuilder();
      builder.addConfig(require(pathToJSON));
      builder.addConfig({destination: null});
      builder.normalizeConfig(['destination']);
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
      let builder = new KssBuilder();
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
      let builder = new KssBuilder();
      builder.setLogFunction(logFunction);
      expect(builder.logFunction).to.deep.equal(logFunction);
    });
  });

  describe('.clone()', function() {
    it('should clone the given directory to the given destination', function() {
      let destination = helperUtils.fixtures('..', 'output', 'clone'),
        builder = new KssBuilder();
      return builder.clone(helperUtils.fixtures('builder'), destination).catch(error => {
        expect(error).to.not.exist;
      }).then(result => {
        expect(result).to.be.undefined;
        return fs.removeAsync(destination);
      });
    });

    it('should fail to clone if the given destination exists', function() {
      let builder = new KssBuilder();
      return builder.clone(helperUtils.fixtures('builder'), helperUtils.fixtures('includes')).then(result => {
        expect(result).to.not.be.undefined;
      }).catch(error => {
        expect(error.message).to.equal('This folder already exists: ' + helperUtils.fixtures('includes'));
      });
    });

    it('should skip node_modules and dot-hidden paths', function() {
      let destination = helperUtils.fixtures('..', 'output', 'clone-skip'),
        builder = new KssBuilder();
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
      let obj = (new KssBuilder()).init();
      return obj.then(() => {
        expect(obj instanceof Promise).to.be.true;
      });
    });
  });

  describe('.prepare()', function() {
    it('should return the style guide given to it', function() {
      let builder = new KssBuilder(),
        styleGuide = new kss.KssStyleGuide({sections: [{header: 'Section', reference: '1.1'}]});
      return builder.prepare(styleGuide).then((result) => {
        expect(result).to.deep.equal(styleGuide);
      });
    });
  });

  describe('.build()', function() {
    it('should return the style guide given to it', function() {
      let builder = new KssBuilder(),
        styleGuide = new kss.KssStyleGuide({sections: [{header: 'Section', reference: '1.1'}]});
      return builder.build(styleGuide).then((result) => {
        expect(result).to.deep.equal(styleGuide);
      });
    });
  });
});
