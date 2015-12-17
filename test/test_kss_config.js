/* eslint-disable max-nested-callbacks */

'use strict';

var KssGenerator = require('../generator/kss_generator');
var pathToJSON = helperUtils.fixtures('cli-option-config.json');

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
      (new kss.KssConfig({})).should.respondTo(method);
      done();
    });
  });
  /* eslint-enable guard-for-in,no-loop-func */

  describe('KssConfig constructor', function() {
    it('should initialize the data', function(done) {
      var kssConfig = new kss.KssConfig();
      kssConfig.should.have.property('config');
      kssConfig.should.have.property('options');
      kssConfig.options.should.have.property('css');
      kssConfig.options.should.have.property('js');
      kssConfig.options.should.have.property('custom');
      kssConfig.options.should.have.property('verbose');
      done();
    });

    it('should return a KssConfig object when called normally', function(done) {
      /* eslint-disable new-cap */
      var kssConfig = kss.KssConfig();
      kssConfig.should.be.an.instanceof(kss.KssConfig);
      done();
      /* eslint-enable new-cap */
    });

    it('should set config when given an object', function(done) {
      var opts = require(pathToJSON);
      var kssConfig = new kss.KssConfig(opts);
      kssConfig.config.source.should.equal('with-include');
      done();
    });
  });

  describe('.set()', function() {
    it('should set this.config', function(done) {
      var kssConfig = new kss.KssConfig();
      kssConfig.set({source: 'isSet'});
      kssConfig.config.source.should.equal('isSet');
      done();
    });

    it('should not unset this.config', function(done) {
      var kssConfig = new kss.KssConfig(require(pathToJSON));
      kssConfig.set({source: 'isSet'});
      kssConfig.config.destination.should.equal('../output/nested');
      done();
    });
  });

  describe('.get()', function() {
    it('should return this.config', function(done) {
      var key,
        config,
        kssConfig = new kss.KssConfig(require(pathToJSON));
      config = kssConfig.get();
      for (key in config) {
        if (config.hasOwnProperty(key)) {
          config[key].should.equal(kssConfig.config[key]);
        }
      }
      done();
    });

    it('should return this.config.key given key', function(done) {
      var key,
        kssConfig = new kss.KssConfig(require(pathToJSON));
      for (key in kssConfig.config) {
        if (kssConfig.config.hasOwnProperty(key)) {
          kssConfig.get(key).should.equal(kssConfig.config[key]);
        }
      }
      done();
    });
  });

  describe('.addOptions()', function() {
    it('should add to this.options', function(done) {
      var kssConfig = new kss.KssConfig(require(pathToJSON));
      kssConfig.addOptions({
        candy: {
          description: 'I want candy.'
        }
      });
      kssConfig.options.candy.should.exist;
      kssConfig.options.candy.description.should.exist;
      done();
    });
  });

  describe('.loadJSON()', function() {
    it('should load config from a JSON file', function(done) {
      var kssConfig = new kss.KssConfig();
      kssConfig.loadJSON(pathToJSON);
      kssConfig.config.source.should.exist;
      kssConfig.config.source.should.equal('with-include');
      done();
    });

    it('should store the absolute path to the JSON file', function(done) {
      var kssConfig = new kss.KssConfig();
      kssConfig.loadJSON('test/fixtures/cli-option-config.json');
      kssConfig.config.config.should.equal(helperUtils.fixtures('cli-option-config.json'));
      done();
    });

    it('should store keys in the JSON file', function(done) {
      var kssConfig = new kss.KssConfig();
      kssConfig.loadJSON(pathToJSON);
      kssConfig.config.configFileKeys.should.deep.equal(['//', 'source', 'destination', 'template']);
      done();
    });
  });

  describe('.normalize()', function() {
    it('should normalize a "multiple" option to an array of values', function(done) {
      var kssConfig = new kss.KssConfig();
      kssConfig.set({source: 'with-include'});
      kssConfig.normalize();
      kssConfig.config.source.should.be.an.instanceOf(Array);
      kssConfig.set({source: ['with-include', 'missing-homepage']});
      kssConfig.normalize();
      kssConfig.config.source.should.be.an.instanceOf(Array);
      // Yargs will set any option without a default to undefined.
      /* eslint-disable no-undefined */
      kssConfig.set({source: undefined});
      kssConfig.normalize();
      kssConfig.config.source.should.be.an.instanceOf(Array);
      done();
    });

    it('should normalize a non-"multiple" option to a single value', function(done) {
      var kssConfig = new kss.KssConfig();
      kssConfig.set({template: ['empty-source', 'with-include', 'template']});
      kssConfig.normalize();
      kssConfig.config.template.should.be.a('string');
      done();
    });

    it('should resolve paths relative to the current working directory', function(done) {
      var kssConfig = new kss.KssConfig(require(pathToJSON));
      kssConfig.normalize();
      kssConfig.config.source[0].should.equal(path.resolve('with-include'));
      done();
    });

    it('should resolve paths relative to the given config file', function(done) {
      // Simulate how yargs outputs its --config option.
      var opts = require(pathToJSON);
      opts['config'] = pathToJSON;
      var kssConfig = new kss.KssConfig(opts);
      kssConfig.normalize();
      kssConfig.config.source[0].should.equal(path.resolve(helperUtils.fixtures(), 'with-include'));
      // The normal way to add JSON config.
      kssConfig = new kss.KssConfig();
      kssConfig.loadJSON(pathToJSON);
      kssConfig.normalize();
      kssConfig.config.source[0].should.equal(path.resolve(helperUtils.fixtures(), 'with-include'));
      done();
    });

    it('should not try to resolve a null path', function(done) {
      var kssConfig = new kss.KssConfig(require(pathToJSON));
      kssConfig.set({destination: null});
      kssConfig.normalize();
      should.equal(kssConfig.config.destination, null);
      done();
    });
  });

  describe('.loadGenerator()', function() {
    it('should return KssGenerator object', function(done) {
      var generator,
        kssConfig = new kss.KssConfig();
      kssConfig.set({template: 'generator/handlebars/template'});
      generator = kssConfig.loadGenerator();
      generator.should.be.an.instanceof(KssGenerator);
      done();
    });

    it('should return KssGenerator object even if the template does not specify one', function(done) {
      var generator,
        kssConfig = new kss.KssConfig({template: helperUtils.fixtures('template')});
      generator = kssConfig.loadGenerator();
      generator.should.be.an.instanceof(KssGenerator);
      done();
    });

    it('should load the generator\'s options', function(done) {
      var generator,
        kssConfig = new kss.KssConfig({template: 'generator/handlebars/template'});
      generator = kssConfig.loadGenerator();
      generator.should.be.an.instanceof(KssGenerator);
      should.exist(kssConfig.options['placeholder']);
      done();
    });

    it('should load the template\'s options', function(done) {
      var generator,
        kssConfig;
      kssConfig = new kss.KssConfig({template: 'generator/handlebars/template'});
      generator = kssConfig.loadGenerator();
      generator.should.be.an.instanceof(KssGenerator);
      should.exist(kssConfig.options['nav-depth']);
      done();
    });
  });
});
