'use strict';

const KssBuilder = require('../builder'),
  KssBuilderHandlebars = require('../builder/class/handlebars');

describe('KssBuilderHandlebars object API', function() {

  describe('KssBuilderHandlebars constructor', function() {
    it('should create an instance of KssBuilder', function() {
      const builder = new KssBuilderHandlebars();
      expect(builder).to.be.instanceOf(KssBuilder);
    });

    it('should set the proper API version', function() {
      let builder = new KssBuilderHandlebars();
      expect(builder.API).to.equal('3.0');
    });

    it('should set the given options', function() {
      let options = {
        custom: {option: 1},
        custom2: {option: 2}
      };
      let builder = new KssBuilderHandlebars(options);
      expect(builder.options.custom).to.deep.equal(options.custom);
      expect(builder.options.custom2).to.deep.equal(options.custom2);
    });

    it('should implement the default options', function() {
      let builder = new KssBuilderHandlebars();
      expect(Object.getOwnPropertyNames(builder.options)).to.deep.equal(['source', 'destination', 'mask', 'clone', 'builder', 'css', 'js', 'custom', 'verbose', 'helpers', 'homepage', 'placeholder', 'nav-depth']);
    });
  });

  /* eslint-disable guard-for-in,no-loop-func */
  ['createMenu',
    'buildPage'
  ].forEach(function(method) {
    it('implements ' + method + '() method', function() {
      expect((new KssBuilderHandlebars())).to.respondTo(method);
    });
  });
  /* eslint-enable guard-for-in,no-loop-func */
});
