/* eslint-disable max-nested-callbacks */

'use strict';

const KssBuilder = require('../builder'),
  Promise = require('bluebird');

const fs = Promise.promisifyAll(require('fs-extra')),
  API = '3.0';

describe('KssBuilder object API', function() {
  /* eslint-disable guard-for-in,no-loop-func */
  ['log',
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
    it('should set the "undefined" API version', function() {
      let builder = new KssBuilder();
      expect(builder.API).to.equal('undefined');
    });

    it('should implement the default options', function() {
      let builder = new KssBuilder();
      expect(Object.getOwnPropertyNames(builder.options)).to.deep.equal(['source', 'destination', 'mask', 'clone', 'template', 'css', 'js', 'custom', 'verbose']);
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
        expect(error.message).to.equal('kss-node expected the template\'s builder to implement KssBuilder API version ' + API + '; version "undefined" is being used instead.');
      });
    });

    it('should fail if the given API is not equal to the current API', function() {
      let builder = new KssBuilder();
      builder.API = '2.0';
      return KssBuilder.checkBuilder(builder).then(result => {
        expect(result).to.not.exist;
      }).catch(error => {
        expect(error.message).to.equal('kss-node expected the template\'s builder to implement KssBuilder API version ' + API + '; version "2.0" is being used instead.');
      });
    });

    it('should fail if the given API is newer than the current API', function() {
      let builder = new KssBuilder();
      builder.API = '3.999';
      return KssBuilder.checkBuilder(builder).then(result => {
        expect(result).to.not.exist;
      }).catch(error => {
        expect(error.message).to.equal('kss-node expected the template\'s builder to implement KssBuilder API version ' + API + '; version "3.999" is being used instead.');
      });
    });
  });

  describe('.clone()', function() {
    it('should clone the given directory to the given destination', function() {
      let destination = helperUtils.fixtures('..', 'output', 'clone'),
        builder = new KssBuilder();
      return builder.clone(helperUtils.fixtures('template'), destination).catch(error => {
        expect(error).to.not.exist;
      }).then(result => {
        expect(result).to.be.undefined;
        return fs.removeAsync(destination);
      });
    });

    it('should fail to clone if the given destination exists', function() {
      let builder = new KssBuilder();
      return builder.clone(helperUtils.fixtures('template'), helperUtils.fixtures('includes')).then(result => {
        expect(result).to.not.be.undefined;
      }).catch(error => {
        expect(error.message).to.equal('This folder already exists: ' + helperUtils.fixtures('includes'));
      });
    });

    it('should skip node_modules and dot-hidden paths', function() {
      let destination = helperUtils.fixtures('..', 'output', 'clone-skip'),
        builder = new KssBuilder();
      return builder.clone(helperUtils.fixtures('template'), destination).then(() => {
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
    it('should set the given config', function() {
      let builder = new KssBuilder(),
        config = {test: 'config'};
      return builder.init(config).then(() => {
        expect(builder.config).to.deep.equal(config);
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
