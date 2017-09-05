'use strict';

let KssBuilderBaseLiquid;

try {
  // In order for a builder to be "kss clone"-able, it must use the
  // require('kss/builder/path') syntax.
  KssBuilderBaseLiquid = require('kss/builder/base/liquid');
} catch (e) {
  // The above require() line will always work.
  //
  // Unless you are one of the developers of kss-node and are using a git clone
  // of kss-node where this code will not be inside a "node_modules/kss" folder
  // which would allow node.js to find it with require('kss/anything'), forcing
  // you to write a long-winded comment and catch the error and try again using
  // a relative path.
  KssBuilderBaseLiquid = require('../base/liquid');
}

/**
 * A kss-node builder that takes input files and builds a style guide using Twig
 * templates.
 */
class KssBuilderLiquid extends KssBuilderBaseLiquid {
  /**
   * Create a builder object.
   */
  constructor() {
    // First call the constructor of KssBuilderBaseTwig.
    super();

    // Then tell kss which Yargs-like options this builder adds.
    this.addOptionDefinitions({
      title: {
        group: 'Style guide:',
        string: true,
        multiple: false,
        describe: 'Title of the style guide',
        default: 'KSS Style Guide'
      }
    });
  }
}

module.exports = KssBuilderLiquid;
