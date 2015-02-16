/* **************************************************************
   See kss_example_generator.js for how to implement a generator.
   ************************************************************** */

var KssGenerator;

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
