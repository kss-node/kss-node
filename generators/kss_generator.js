/* **************************************************************
   See kss_example_generator.js for how to implement a generator.
   ************************************************************** */

var KssGenerator,
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
