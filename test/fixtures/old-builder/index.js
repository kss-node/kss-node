'use strict';

const KssBuilder = require('../../../builder');

class KssBuilderOld extends KssBuilder {
  constructor(options) {
    super(options);
    this.API = '1.0';
  }
}

module.exports = new KssBuilderOld();
