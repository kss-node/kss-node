// Define "KssExampleGenerator" as the name of our example template engine.
var KssExampleGenerator,
  // Import the KssGenerator object. We will use its API to scaffold our
  // generator.
  KssGenerator = require('kss/generator'),
  path = require('path');


/**
 * Export our "KssExampleGenerator" object.
 *
 * Our generator is an instance of the KssGenerator object with
 * additional functionality added by overriding the parent methods.
 */
module.exports = KssExampleGenerator = new KssGenerator('2.0');

/**
 * Clone a template's files.
 *
 * This method is fairly simple; it copies one directory to the specified
 * location. An instance of KssGenerator does not need to override this
 * method, but it can if it needs to do something more complicated.
 */
KssExampleGenerator.prototype.clone = function(templatePath, destinationPath) {
  // Note that, at this point, KssExampleGenerator.init() has not been called.
  console.log('Example template cloned! (not really.)');
};

/**
 * Initialize the style guide creation process.
 *
 * This method is given a configuration JSON object with the details of the
 * requested style guide generation. The generator can use this information for
 * any necessary tasks before the KSS parsing of the source files.
 *
 * @param {array} config Array of configuration for the requested generation.
 */
KssExampleGenerator.init = function(config) {
  // At the very least, generators MUST save the configuration parameters.
  this.config = config;

  // This example generator hard-codes the demo source.
  this.config.source = path.resolve('../demo');

  // A real generator should initialize the template system being used by this
  // generator. For example, KssHandlebarsGenerator loads and initializes the
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
KssExampleGenerator.prototype.parse = function(callback) {
  console.log('...Parsing the demo style guide:');

  // The default parse() method looks at the paths to the source folders and
  // uses KSS' traverse method to load, read and parse the source files. Other
  // generators may want to use KSS' parse method if they have already loaded
  // the source files through some other mechanism.
  Kss.traverse(this.config.source, {
    multiline : true,
    markdown  : true,
    markup    : true,
    mask      : this.config.mask,
    custom    : this.config.custom
  }, function(err, styleguide) {
    if (err) throw err;
    callback(styleguide);
  });
};

/**
 * Generate the HTML files of the style guide given a KssStyleguide object.
 *
 * This the callback function passed to the parse() method. The callback is
 * wrapped in a closure so that it has access to "this" object (the methods and
 * properties of KssExampleGenerator.)
 *
 * @param {KssStyleguide} styleguide The KSS style guide in object format.
 */
KssExampleGenerator.prototype.generate = function(styleguide) {
  console.log('...Generating the demo style guide.' + this.warning);
};
