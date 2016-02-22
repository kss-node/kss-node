'use strict';

const KssGenerator = require('../generator'),
  kssHandlebarsGenerator = require('../generator/handlebars');

describe('kssHandlebarsGenerator object', function() {
  it('should be an instance of KssGenerator', function() {
    expect(kssHandlebarsGenerator).to.be.instanceOf(KssGenerator);
  });

  it('should implement the correct API', function() {
    expect(kssHandlebarsGenerator.implementsAPI).to.equal(kssHandlebarsGenerator.API);
  });

  it('should implement 4 helpers', function() {
    expect(Object.getOwnPropertyNames(kssHandlebarsGenerator.options)).to.deep.equal(['helpers', 'homepage', 'placeholder', 'nav-depth']);
  });

  /* eslint-disable guard-for-in,no-loop-func */
  ['init',
    'generate',
    'createMenu',
    'generatePage'
  ].forEach(function(method) {
    it('implements ' + method + '() method', function() {
      expect(kssHandlebarsGenerator).to.respondTo(method);
      expect(kssHandlebarsGenerator.hasOwnProperty(method)).to.be.true;
    });
  });
  /* eslint-enable guard-for-in,no-loop-func */
});
