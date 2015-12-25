'use strict';

describe('kss object API', function() {
  it('should be a function taking 2 arguments', function(done) {
    should.exist(kss);
    kss.should.be.a('Function');
    kss.length.should.equal(2);
    done();
  });

  /* eslint-disable no-loop-func */
  ['parse',
    'traverse'
  ].forEach(function(method) {
    it('has ' + method + '() method', function(done) {
      kss.should.itself.respondTo(method);
      done();
    });
  });

  ['KssConfig',
    'KssModifier',
    'KssParameter',
    'KssSection',
    'KssStyleguide'
  ].forEach(function(method) {
    it('has ' + method + '() constructor', function(done) {
      kss.should.itself.respondTo(method);
      var Constructor = require('../lib/kss_' + method.replace('Kss', '').toLowerCase());
      var obj = new kss[method]();
      obj.should.be.an.instanceof(Constructor);
      done();
    });
  });
  /* eslint-enable no-loop-func */
});
