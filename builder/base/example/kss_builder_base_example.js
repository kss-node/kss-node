'use strict';

/**
 * The `kss/builder/base/example` module loads the KssBuilderBaseExample
 * class, a `{@link KssBuilderBase}` sub-class using no templating.
 * ```
 * const KssBuilderBaseExample = require('kss/builder/base/example');
 * ```
 * @module kss/builder/base/example
 */

// Import the KssBuilderBase class. We will extend it to scaffold our builder.
// Note: Since you will be building a sub-class outside of the kss module, this
// next line will be: const KssBuilderBase = require('kss/builder/base');
const KssBuilderBase = require('..'),
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
        string: true,
        description: 'This is a custom command-line option used by this Builder.'
      }
    });
  }

  /**
   * Clone a builder's files.
   *
   * The KssBuilderBase.clone() method is fairly simple; it copies one directory
   * to the specified location. A sub-class of KssBuilderBase does not need to
   * override this method, but it can if it needs to do something more
   * complicated.
   *
   * @param {string} builderPath Path to the builder to clone.
   * @param {string} destinationPath Path to the destination of the newly cloned
   *   builder.
   * @returns {Promise.<null>} A `Promise` object resolving to `null`.
   */
  clone(builderPath, destinationPath) {
    // Note that, at this point, KssBuilderBaseExample.prepare() method has not
    // been called.
    this.log('Example builder cloned to ' + destinationPath + '! (not really.)');

    return Promise.resolve();
  }

  /**
   * Allow the builder to preform pre-build tasks or modify the KssStyleGuide
   * object.
   *
   * The method can be set by any KssBuilderBase sub-class to do any custom tasks
   * after the KssStyleGuide object is created and before the HTML style guide
   * is built.
   *
   * @param {KssStyleGuide} styleGuide The KSS style guide in object format.
   * @returns {Promise.<KssStyleGuide>} A `Promise` object resolving to
   *   `styleGuide`.
   */
  prepare(styleGuide) {
    // First we let KssBuilderBase.prepare() clean-up the style guide object.
    return super.prepare(styleGuide).then(styleGuide => {
      // Then we do our own prep work inside this Promise's .then() method.

      // A real builder should initialize the templating system being used by
      // this builder. For example, KssBuilderBaseHandlebars loads and
      // initializes the Handlebars templating system.
      this.warningMessage = ' (not really.)';

      this.log('...Preparing the style guide.' + this.warningMessage);

      // This example builder hard-codes the demo source.
      this.options.source = [path.resolve(__dirname, '..', '..', '..', 'demo')];

      return Promise.resolve(styleGuide);
    });
  }

  /**
   * Build the HTML files of the style guide given a KssStyleGuide object.
   *
   * @param {KssStyleGuide} styleGuide The KSS style guide in object format.
   * @returns {Promise} A `Promise` object.
   */
  build(styleGuide) {
    this.log('...Building the demo style guide.' + this.warningMessage);

    return Promise.resolve(styleGuide);
  }
}

// Export our "KssBuilderBaseExample" class.
module.exports = KssBuilderBaseExample;
