'use strict';

const KssBuilderBase = require('../../../builder/base');

class KssBuilderNewer extends KssBuilderBase {
  constructor() {
    super();
    this.API = '10.0';
  }
}

module.exports = KssBuilderNewer;
