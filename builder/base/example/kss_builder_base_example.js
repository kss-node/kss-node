'use strict';

/**
 * The `kss/builder/base/example` module loads the KssBuilderBaseExample
 * class, a `{@link KssBuilderBase}` using no templating.
 * ```
 * const KssBuilderBaseExample = require('kss/builder/base/example');
 * ```
 * @module kss/builder/base/example
 */

// Import the KssBuilderBase class. We will extend it to scaffold our builder.
const KssBuilderBase = require('kss/builder/base'),
  path = require('path');

// Define "KssBuilderBaseExample" as the name of our example builder class.
//
// Our builder is a sub-class of the KssBuilderBase class with additional
// functionality added by overriding the parent methods.
class KssBuilderBaseExample extends KssBuilderBase {

  /**
   * Create a KssBuilderBaseExample object.
   *
   * ```
   * const KssBuilderBaseExample = require('kss/builder/base/example');
   * const builder = new KssBuilderBaseExample();
   * ```
   */
  constructor() {
    super();

    // Store the version of the builder API that the builder instance is
    // expecting; we will verify this in loadBuilder().
    this.API = '3.0';

    this.addOptionDefinitions({
      'example-option': {
        alias: 'u',
        string: true,
        description: 'This is a custom command-line option used by this Builder.'
      }
    });
  }

  /**
   * Clone a builder's files.
   *
   * The KssBuilderBase.clone() method is a simple and functional implementation; it
   * copies one directory to the specified location. An instance of KssBuilderBase
   * does not need to override this method, but it can if it needs to do something
   * more complicated.
   *
   * @param {string} builderPath Path to the builder to clone.
   * @param {string} destinationPath Path to the destination of the newly cloned
   *   builder.
   * @returns {Promise} A `Promise` object.
   */
  clone(builderPath, destinationPath) {
    // Note that, at this point, KssBuilderBaseExample.init() method has not
    // been called.
    this.log('Example builder cloned to ' + destinationPath + '! (not really.)');

    return Promise.resolve();
  }

  /**
   * Initialize the style guide creation process.
   *
   * This method can be set by any KssBuilderBase sub-class to do any custom tasks
   * before the style guide is built.
   *
   * @returns {Promise} A `Promise` object resolving to `null`.
   */
  init() {
    // This example builder hard-codes the demo source.
    this.config.source = [path.resolve('..', 'demo')];

    // A real builder should initialize the templating system being used by this
    // builder. For example, KssBuilderBaseHandlebars loads and initializes the
    // Handlebars templating system.
    this.warning = ' (not really.)';

    return Promise.resolve();
  }

  /**
   * Build the HTML files of the style guide given a KssStyleGuide object.
   *
   * @param {KssStyleGuide} styleGuide The KSS style guide in object format.
   * @returns {Promise} A `Promise` object.
   */
  build(styleGuide) {
    styleGuide.sections();
    this.log('...Building the demo style guide.' + this.warning);

    return Promise.resolve();
  }
}

// Export our "KssBuilderBaseExample" class.
module.exports = KssBuilderBaseExample;
