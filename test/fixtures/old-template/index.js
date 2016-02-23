'use strict';

const KssBuilder = require('../../../builder');

class KssOldTemplate extends KssBuilder {
  constructor(options) {
    super(options);
    this.API = '1.0';
  }
}

module.exports = new KssOldTemplate();
