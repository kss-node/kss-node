'use strict';

// Emulate a kss-node 2.0 generator.
let KssGenerator = function(version, options) {
  this.API = '2.1';
  this.implementsAPI = typeof version === 'undefined' ? 'undefined' : version;
  this.options = options || {};
};

// Emulate a kss-node 2.0 template.
const template = {
  generator: new KssGenerator('2.0')
};

module.exports = template;
