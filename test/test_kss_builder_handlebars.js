'use strict';

const KssBuilder = require('../builder'),
  kssBuilderHandlebars = require('../builder/handlebars');

describe('kssBuilderHandlebars object', function() {
  it('should be an instance of KssBuilder', function() {
    expect(kssBuilderHandlebars).to.be.instanceOf(KssBuilder);
  });

  it('should implement the correct API', function() {
    expect(kssBuilderHandlebars.API).to.equal('3.0');
  });

  it('should implement 4 helpers', function() {
    expect(Object.getOwnPropertyNames(kssBuilderHandlebars.options)).to.deep.equal(['helpers', 'homepage', 'placeholder', 'nav-depth']);
  });

  /* eslint-disable guard-for-in,no-loop-func */
  ['init',
    'build',
    'createMenu',
    'buildPage'
  ].forEach(function(method) {
    it('implements ' + method + '() method', function() {
      expect(kssBuilderHandlebars).to.respondTo(method);
      expect(kssBuilderHandlebars.hasOwnProperty(method)).to.be.true;
    });
  });
  /* eslint-enable guard-for-in,no-loop-func */
});
