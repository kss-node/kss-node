/* global describe,it */

'use strict';

var kss = require('../index.js');

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
      kss.should.have.method(method);
      done();
    });
  });
  /* eslint-enable guard-for-in,no-loop-func */
});
