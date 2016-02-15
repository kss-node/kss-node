'use strict';

const KssGenerator = require('../generator'),
  Promise = require('bluebird');

const fs = Promise.promisifyAll(require('fs-extra'));

describe('KssGenerator object API', function() {
  /* eslint-disable guard-for-in,no-loop-func */
  ['log',
    'setLogFunction',
    'checkGenerator',
    'clone',
    'init',
    'prepare',
    'generate'
  ].forEach(function(method) {
    it('has ' + method + '() method', function(done) {
      expect(new KssGenerator({})).to.respondTo(method);
      done();
    });
  });
  /* eslint-enable guard-for-in,no-loop-func */

  describe('KssGenerator constructor', function() {
    it('should set the current API version', function() {
      let generator = new KssGenerator();
      expect(generator.API).to.equal('3.0');
    });

    it('should set the given implementsAPI version', function() {
      let generator = new KssGenerator('VALUE');
      expect(generator.implementsAPI).to.equal('VALUE');
    });

    it('should set the given options', function() {
      let options = {
        options: 'custom'
      };
      let generator = new KssGenerator('3.0', options);
      expect(generator.options).to.deep.equal(options);
    });

    it('should set the default log function', function() {
      let generator = new KssGenerator('3.0');
      expect(generator.logFunction).to.deep.equal(console.log);
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
      let generator = new KssGenerator('3.0');
      generator.setLogFunction(logFunction);
      generator.log('test', 'message');
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
      let generator = new KssGenerator('3.0');
      generator.setLogFunction(logFunction);
      expect(generator.logFunction).to.deep.equal(logFunction);
    });
  });

  describe('.checkGenerator()', function() {
    it('should return a Promise', function() {
      let generator = new KssGenerator();
      let obj = generator.checkGenerator();
      return obj.catch(() => {
        expect(obj instanceof Promise).to.be.true;
      });
    });

    it('should fail if the API is not given to the constructor', function() {
      let generator = new KssGenerator();
      return generator.checkGenerator().then(result => {
        expect(result).to.not.exist;
      }).catch(error => {
        expect(error.message).to.equal('kss-node expected the template\'s generator to implement KssGenerator API version ' + generator.API + '; version "undefined" is being used instead.');
      });
    });

    it('should fail if the given API is not equal to the current API', function() {
      let generator = new KssGenerator('2.0');
      return generator.checkGenerator().then(result => {
        expect(result).to.not.exist;
      }).catch(error => {
        expect(error.message).to.equal('kss-node expected the template\'s generator to implement KssGenerator API version ' + generator.API + '; version "2.0" is being used instead.');
      });
    });

    it('should fail if the given API is newer than the current API', function() {
      let generator = new KssGenerator('3.1000');
      return generator.checkGenerator().then(result => {
        expect(result).to.not.exist;
      }).catch(error => {
        expect(error.message).to.equal('kss-node expected the template\'s generator to implement KssGenerator API version ' + generator.API + '; version "3.1000" is being used instead.');
      });
    });
  });

  describe('.clone()', function() {
    it('should clone the given directory to the given destination', function() {
      let destination = helperUtils.fixtures('../output/clone'),
        generator = new KssGenerator();
      return generator.clone(helperUtils.fixtures('template'), destination).catch(error => {
        expect(error).to.not.exist;
      }).then(result => {
        expect(result).to.be.undefined;
        return fs.removeAsync(destination);
      });
    });

    it('should fail to clone if the given destination exists', function() {
      let generator = new KssGenerator();
      return generator.clone(helperUtils.fixtures('template'), helperUtils.fixtures('includes')).then(result => {
        expect(result).to.not.be.undefined;
      }).catch(error => {
        expect(error.message).to.equal('This folder already exists: ' + helperUtils.fixtures('includes'));
      });
    });
  });

  describe('.init()', function() {
    it('should set the given config', function() {
      let generator = new KssGenerator(),
        config = {test: 'config'};
      return generator.init(config).then(() => {
        expect(generator.config).to.deep.equal(config);
      });
    });
  });

  describe('.prepare()', function() {
    it('should return the style guide given to it', function() {
      let generator = new KssGenerator(),
        styleGuide = new kss.KssStyleGuide({sections: [{header: 'Section', reference: '1.1'}]});
      return generator.prepare(styleGuide).then((result) => {
        expect(result).to.deep.equal(styleGuide);
      });
    });
  });

  describe('.generate()', function() {
    it('should return the style guide given to it', function() {
      let generator = new KssGenerator(),
        styleGuide = new kss.KssStyleGuide({sections: [{header: 'Section', reference: '1.1'}]});
      return generator.generate(styleGuide).then((result) => {
        expect(result).to.deep.equal(styleGuide);
      });
    });
  });
});
