'use strict';

describe('kss object API', function() {
  /* eslint-disable guard-for-in,no-loop-func */
  ['parse',
    'traverse',
    'KssSection',
    'KssModifier',
    'KssParameter',
    'KssStyleguide'
  ].forEach(function(method) {
    it('has ' + method + '() method', function(done) {
      kss.should.exist;
      kss.should.respondTo(method);
      done();
    });
  });
  /* eslint-enable guard-for-in,no-loop-func */
});
