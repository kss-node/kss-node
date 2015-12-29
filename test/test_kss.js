'use strict';

describe('kss object API', function() {
  it('should be a function taking 2 arguments', function(done) {
    expect(kss).to.exist;
    expect(kss).to.be.a('Function');
    expect(kss.length).to.equal(2);
    done();
  });

  /* eslint-disable no-loop-func */
  ['parse',
    'traverse'
  ].forEach(function(method) {
    it('has ' + method + '() method', function(done) {
      expect(kss).to.itself.respondTo(method);
      done();
    });
  });

  ['KssConfig',
    'KssModifier',
    'KssParameter',
    'KssSection',
    'KssStyleGuide'
  ].forEach(function(method) {
    it('has ' + method + '() constructor', function(done) {
      expect(kss).to.itself.respondTo(method);
      var Constructor = require('../lib/kss_' + method.replace('Kss', '').toLowerCase());
      var obj = new kss[method]();
      expect(obj).to.be.an.instanceof(Constructor);
      done();
    });
  });
  /* eslint-enable no-loop-func */
});
