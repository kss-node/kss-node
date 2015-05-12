'use strict';

/**
 * The `kss/generator/example` module loads the KssExampleGenerator
 * object, a `{@link KssGenerator}` object using no templating.
 * ```
 * var kssExampleGenerator = require('kss/generator/example');
 * ```
 * @module kss/generator/example
 */

// Import the KssGenerator object. We will use its API to scaffold our
// generator.
var KssGenerator = require('kss/generator'),
  Kss = require('kss'),
  path = require('path');

// Define "kssExampleGenerator" as the name of our example template engine.
//
// Our generator is an instance of the KssGenerator object with
// additional functionality added by overriding the parent methods.
//
// See the docs for KssGenerator() for info about its parameters.
var kssExampleGenerator = new KssGenerator('2.0', {
  'exampleoption': {
    alias: 'u',
    string: true,
    description: 'This is a custom command-line option used by this Generator.'
  }
});

/**
 * Clone a template's files.
 *
 * The KssGenerator.clone() method is a simple and functional implementation; it
 * copies one directory to the specified location. An instance of KssGenerator
 * does not need to override this method, but it can if it needs to do something
 * more complicated.
 * @param {string} templatePath    Path to the template to clone.
 * @param {string} destinationPath Path to the destination of the newly cloned
 *                                 template.
 */
kssExampleGenerator.prototype.clone = function(templatePath, destinationPath) {
  // Note that, at this point, kssExampleGenerator.init() has not been called.
  console.log('Example template cloned to ' + destinationPath + '! (not really.)');
};

/**
 * Initialize the style guide creation process.
 *
 * This method is given a configuration JSON object with the details of the
 * requested style guide generation. The generator can use this information for
 * any necessary tasks before the KSS parsing of the source files.
 *
 * @param {Object} config Configuration object for the style guide generation.
 */
kssExampleGenerator.init = function(config) {
  // At the very least, generators MUST save the configuration parameters.
  this.config = config;

  // This example generator hard-codes the demo source.
  this.config.source = [path.resolve('../demo')];

  // A real generator should initialize the template system being used by this
  // generator. For example, kssHandlebarsGenerator loads and initializes the
  // Handlebars templating system.
  this.warning = ' (not really.)';
};

/**
 * Parse the source files for KSS comments and create a KssStyleguide object.
 *
 * When finished, it passes the completed KssStyleguide to the given callback.
 *
 * @param {function} callback Function that takes a KssStyleguide and generates
 *                            the HTML files of the style guide.
 */
kssExampleGenerator.prototype.parse = function(callback) {
  console.log('...Parsing the demo style guide:');

  // The default parse() method looks at the paths to the source folders and
  // uses KSS' traverse method to load, read and parse the source files. Other
  // generators may want to use KSS' parse method if they have already loaded
  // the source files through some other mechanism.
  Kss.traverse(this.config.source, {
    multiline: true,
    markdown: true,
    markup: true,
    mask: this.config.mask,
    custom: this.config.custom
  }, function(err, styleguide) {
    if (err) {
      throw err;
    }
    callback(styleguide);
  });
};

/**
 * Generate the HTML files of the style guide given a KssStyleguide object.
 *
 * This is the callback function passed to the parse() method. The callback is
 * wrapped in a closure so that it has access to "this" object (the methods and
 * properties of kssExampleGenerator.)
 *
 * @param {KssStyleguide} styleguide The KSS style guide in object format.
 */
kssExampleGenerator.prototype.generate = function(styleguide) {
  styleguide.section();
  console.log('...Generating the demo style guide.' + this.warning);
};

// Export our "kssExampleGenerator" object.
module.exports = kssExampleGenerator;
