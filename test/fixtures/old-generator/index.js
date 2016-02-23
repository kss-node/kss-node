'use strict';

// Emulate a kss-node 2.0 generator.
class KssGenerator {
  constructor() {
    this.API = '2.0';
  }
}

// Emulate a kss-node 2.0 template.
const template = {
  builder: new KssGenerator()
};

module.exports = template;
