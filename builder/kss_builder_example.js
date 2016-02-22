'use strict';

/**
 * The `kss/builder/example` module loads the kssBuilderExample
 * object, a `{@link KssBuilder}` object using no templating.
 * ```
 * const kssBuilderExample = require('kss/builder/example');
 * ```
 * @module kss/builder/example
 */

// Import the KssBuilder object. We will use its API to scaffold our
// builder.
const KssBuilder = require('kss/builder'),
  path = require('path');

// Define "kssBuilderExample" as the name of our example template engine.
//
// Our builder is an instance of the KssBuilder object with
// additional functionality added by overriding the parent methods.
//
// See the docs for KssBuilder() for info about its parameters.
const kssBuilderExample = new KssBuilder('3.0', {
  'example-option': {
    alias: 'u',
    string: true,
    description: 'This is a custom command-line option used by this Builder.'
  }
});

/**
 * Clone a template's files.
 *
 * The KssBuilder.clone() method is a simple and functional implementation; it
 * copies one directory to the specified location. An instance of KssBuilder
 * does not need to override this method, but it can if it needs to do something
 * more complicated.
 *
 * @param {string} templatePath    Path to the template to clone.
 * @param {string} destinationPath Path to the destination of the newly cloned
 *                                 template.
 * @returns {Promise} A `Promise` object.
 */
kssBuilderExample.prototype.clone = function(templatePath, destinationPath) {
  // Note that, at this point, kssBuilderExample.init() has not been called.
  this.log('Example template cloned to ' + destinationPath + '! (not really.)');

  return Promise.resolve();
};

/**
 * Initialize the style guide creation process.
 *
 * This method is given a configuration JSON object with the details of the
 * requested style guide build. The builder can use this information for any
 * necessary tasks before the KSS parsing of the source files.
 *
 * @param {Object} config Configuration object for the requested build.
 * @returns {Promise} A `Promise` object.
 */
kssBuilderExample.init = function(config) {
  // At the very least, builders MUST save the configuration parameters.
  this.config = config;

  // This example builder hard-codes the demo source.
  this.config.source = [path.resolve('..', 'demo')];

  // A real builder should initialize the template system being used by this
  // builder. For example, kssBuilderHandlebars loads and initializes the
  // Handlebars templating system.
  this.warning = ' (not really.)';

  return Promise.resolve();
};

/**
 * Build the HTML files of the style guide given a KssStyleGuide object.
 *
 * @param {KssStyleGuide} styleGuide The KSS style guide in object format.
 * @returns {Promise} A `Promise` object.
 */
kssBuilderExample.prototype.build = function(styleGuide) {
  styleGuide.sections();
  this.log('...Building the demo style guide.' + this.warning);

  return Promise.resolve();
};

// Export our "kssBuilderExample" object.
module.exports = kssBuilderExample;
