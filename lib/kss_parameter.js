'use strict';

/**
 * The `kss/lib/kss_parameter` module is normally accessed via the
 * [`KssParameter()`]{@link module:kss.KssParameter} constructor of the `kss`
 * module:
 * ```
 * var kss = require('kss');
 * var parameter = new kss.KssParameter(data);
 * ```
 * @private
 * @module kss/lib/kss_parameter
 */

var KssParameter;

/**
 * An instance of this class is returned on calling `KssSection.parameter`.
 * Exposes convenience methods for interpreting data.
 *
 * @constructor
 * @alias module:kss.KssParameter
 * @param {Object} data A part of the data object passed on by `KssSection`.
 */
KssParameter = function(data) {
  if (!(this instanceof KssParameter)) {
    return new KssParameter();
  }
  this.data = data || {};
  this.init();
};

/**
 * Initializes the object and data passed to the constructor. Called
 * automatically from the KssParameter() constructor; should not be called
 * directly.
 * @private
 */
KssParameter.prototype.init = function() {
};

/**
 * Returns the KssSection object this parameter is associated with.
 * @returns {KssSection} The style guide section the parameter belongs to.
 */
KssParameter.prototype.section = function() {
  return this.data.section;
};

/**
 * Returns the name of the parameter.
 * @returns {string} The name of the parameter.
 */
KssParameter.prototype.name = function() {
  return this.data.name;
};

/**
 * Returns the description of the parameter.
 * @returns {string} The description of the parameter.
 */
KssParameter.prototype.description = function() {
  return this.data.description;
};

module.exports = KssParameter;
