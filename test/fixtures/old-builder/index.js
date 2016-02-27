'use strict';

const KssBuilderBase = require('../../../builder/base');

class KssBuilderOld extends KssBuilderBase {
  constructor(options) {
    super(options);
    this.API = '1.0';
  }
}

module.exports = new KssBuilderOld();
