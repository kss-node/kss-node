/* eslint-disable max-nested-callbacks */

'use strict';

const KssGenerator = require('../generator/kss_generator');

let pathToJSON = helperUtils.fixtures('cli-option-config.json');

describe('KssConfig object API', function() {
  /* eslint-disable guard-for-in,no-loop-func */
  ['set',
    'get',
    'addOptions',
    'loadJSON',
    'normalize',
    'loadGenerator'
  ].forEach(function(method) {
    it('has ' + method + '() method', function(done) {
      expect(new kss.KssConfig({})).to.respondTo(method);
      done();
    });
  });
  /* eslint-enable guard-for-in,no-loop-func */

  describe('KssConfig constructor', function() {
    it('should initialize the data', function(done) {
      let kssConfig = new kss.KssConfig();
      expect(kssConfig).to.have.property('config');
      expect(kssConfig).to.have.property('options');
      expect(kssConfig.options).to.have.property('css');
      expect(kssConfig.options).to.have.property('js');
      expect(kssConfig.options).to.have.property('custom');
      expect(kssConfig.options).to.have.property('verbose');
      done();
    });

    it('should set config when given an object', function(done) {
      let opts = require(pathToJSON);
      let kssConfig = new kss.KssConfig(opts);
      expect(kssConfig.config.source).to.equal('with-include');
      done();
    });
  });

  describe('.set()', function() {
    it('should set this.config', function(done) {
      let kssConfig = new kss.KssConfig();
      kssConfig.set({source: 'isSet'});
      expect(kssConfig.config.source).to.equal('isSet');
      done();
    });

    it('should not unset this.config', function(done) {
      let kssConfig = new kss.KssConfig(require(pathToJSON));
      kssConfig.set({source: 'isSet'});
      expect(kssConfig.config.destination).to.equal('../output/nested');
      done();
    });
  });

  describe('.get()', function() {
    it('should return this.config', function(done) {
      let kssConfig = new kss.KssConfig(require(pathToJSON));
      let config = kssConfig.get();
      for (let key in config) {
        if (config.hasOwnProperty(key)) {
          expect(config[key]).to.equal(kssConfig.config[key]);
        }
      }
      done();
    });

    it('should return this.config.key given key', function(done) {
      let kssConfig = new kss.KssConfig(require(pathToJSON));
      for (let key in kssConfig.config) {
        if (kssConfig.config.hasOwnProperty(key)) {
          expect(kssConfig.get(key)).to.equal(kssConfig.config[key]);
        }
      }
      done();
    });
  });

  describe('.addOptions()', function() {
    it('should add to this.options', function(done) {
      let kssConfig = new kss.KssConfig(require(pathToJSON));
      kssConfig.addOptions({
        candy: {
          description: 'I want candy.'
        }
      });
      expect(kssConfig.options.candy).to.exist;
      expect(kssConfig.options.candy.description).to.exist;
      done();
    });
  });

  describe('.loadJSON()', function() {
    it('should load config from a JSON file', function(done) {
      let kssConfig = new kss.KssConfig();
      kssConfig.loadJSON(pathToJSON);
      expect(kssConfig.config.source).to.exist;
      expect(kssConfig.config.source).to.equal('with-include');
      done();
    });

    it('should store the absolute path to the JSON file', function(done) {
      let kssConfig = new kss.KssConfig();
      kssConfig.loadJSON('test/fixtures/cli-option-config.json');
      expect(kssConfig.config.config).to.equal(helperUtils.fixtures('cli-option-config.json'));
      done();
    });

    it('should store keys in the JSON file', function(done) {
      let kssConfig = new kss.KssConfig();
      kssConfig.loadJSON(pathToJSON);
      expect(kssConfig.config.configFileKeys).to.deep.equal(['//', 'source', 'destination', 'template']);
      done();
    });
  });

  describe('.normalize()', function() {
    it('should normalize a "multiple" option to an array of values', function(done) {
      let kssConfig = new kss.KssConfig();
      kssConfig.set({source: 'with-include'});
      kssConfig.normalize();
      expect(kssConfig.config.source).to.be.an.instanceOf(Array);
      kssConfig.set({source: ['with-include', 'missing-homepage']});
      kssConfig.normalize();
      expect(kssConfig.config.source).to.be.an.instanceOf(Array);
      // Yargs will set any option without a default to undefined.
      /* eslint-disable no-undefined */
      kssConfig.set({source: undefined});
      kssConfig.normalize();
      expect(kssConfig.config.source).to.be.an.instanceOf(Array);
      done();
    });

    it('should normalize a non-"multiple" option to a single value', function(done) {
      let kssConfig = new kss.KssConfig();
      kssConfig.set({template: ['empty-source', 'with-include', 'template']});
      kssConfig.normalize();
      expect(kssConfig.config.template).to.be.a('string');
      done();
    });

    it('should resolve paths relative to the current working directory', function(done) {
      let kssConfig = new kss.KssConfig(require(pathToJSON));
      kssConfig.normalize();
      expect(kssConfig.config.source[0]).to.equal(path.resolve('with-include'));
      done();
    });

    it('should resolve paths relative to the given config file', function(done) {
      // Simulate how yargs outputs its --config option.
      let opts = require(pathToJSON);
      opts['config'] = pathToJSON;
      let kssConfig = new kss.KssConfig(opts);
      kssConfig.normalize();
      expect(kssConfig.config.source[0]).to.equal(path.resolve(helperUtils.fixtures(), 'with-include'));
      // The normal way to add JSON config.
      kssConfig = new kss.KssConfig();
      kssConfig.loadJSON(pathToJSON);
      kssConfig.normalize();
      expect(kssConfig.config.source[0]).to.equal(path.resolve(helperUtils.fixtures(), 'with-include'));
      done();
    });

    it('should not try to resolve a null path', function(done) {
      let kssConfig = new kss.KssConfig(require(pathToJSON));
      kssConfig.set({destination: null});
      kssConfig.normalize();
      expect(kssConfig.config.destination).to.equal(null);
      done();
    });
  });

  describe('.loadGenerator()', function() {
    it('should return KssGenerator object', function(done) {
      let kssConfig = new kss.KssConfig();
      kssConfig.set({template: 'generator/handlebars/template'});
      let generator = kssConfig.loadGenerator();
      expect(generator).to.be.an.instanceof(KssGenerator);
      done();
    });

    it('should return KssGenerator object even if the template does not specify one', function(done) {
      let kssConfig = new kss.KssConfig({template: helperUtils.fixtures('template')});
      let generator = kssConfig.loadGenerator();
      expect(generator).to.be.an.instanceof(KssGenerator);
      done();
    });

    it('should load the generator\'s options', function(done) {
      let kssConfig = new kss.KssConfig({template: 'generator/handlebars/template'});
      let generator = kssConfig.loadGenerator();
      expect(generator).to.be.an.instanceof(KssGenerator);
      expect(kssConfig.options['placeholder']).to.exist;
      done();
    });

    it('should load the template\'s options', function(done) {
      let kssConfig = new kss.KssConfig({template: 'generator/handlebars/template'});
      let generator = kssConfig.loadGenerator();
      expect(generator).to.be.an.instanceof(KssGenerator);
      expect(kssConfig.options['nav-depth']).to.exist;
      done();
    });
  });
});
