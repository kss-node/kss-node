/* **************************************************************
   See kss_example_generator.js for how to implement a generator.
   ************************************************************** */

var KssGenerator,
  Kss = require('../lib/kss.js'),
  wrench = require('wrench');

/**
 * Export the KssGenerator object.
 *
 * This is the base object used by all kss-node generators.
 */
module.exports = KssGenerator = function () {
  if (!(this instanceof KssGenerator)) {
    return new KssGenerator();
  }
};

/**
 * Clone a template's files.
 *
 * This method is fairly simple; it copies one directory to the specified
 * location. An instance of KssGenerator does not need to override this
 * method, but it can if it needs to do something more complicated.
 */
KssGenerator.prototype.clone = function(templatePath, destinationPath) {
  try {
    error = wrench.copyDirSyncRecursive(
      templatePath,
      destinationPath,
      {
        forceDelete: false,
        excludeHiddenUnix: true
      }
    );
    if (error) {
      throw error;
    }
  } catch (e) {
    throw 'Error! This folder already exists: ' + destinationPath;
  }
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
KssGenerator.prototype.init = function(config) {
  // At the very least, generators MUST save the configuration parameters.
  this.config = config;
};

/**
 * Parse the source files for KSS comments and create a KssStyleguide object.
 *
 * When finished, it passes the completed KssStyleguide to the given callback.
 *
 * @param {function} callback Function that takes a KssStyleguide and generates
 *                            the HTML files of the style guide.
 */
KssGenerator.prototype.parse = function(callback) {
  console.log('...Parsing your style guide:');

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
}
