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
    return new KssParameter(data);
  }

  data = data || {};

  this.data = {};
  this.data.section = data.section || null;
  this.data.name = data.name || '';
  this.data.description = data.description || '';
};

/**
 * Gets or sets the `KssSection` object this `KssParameter` is associated with.
 *
 * If the `section` value is provided, the `KssSection` for this parameter is
 * set. Otherwise, the `KssSection` of the parameter is returned.
 *
 * @param {KssSection} section Optional. The `KssSection` that owns the
 *   `KssParameter`.
 * @returns {KssSection|KssParameter} If section is given, the current
 *   `KssParameter` object is returned to allow chaining of methods. Otherwise,
 *   the `KssSection` object the parameter belongs to is returned.
 */
KssParameter.prototype.section = function(section) {
  if (typeof section !== 'undefined') {
    this.data.section = section;
    // Allow chaining.
    return this;
  } else {
    return this.data.section;
  }
};

/**
 * Gets or sets the name of the `KssParameter`.
 *
 * If the `name` value is provided, the name of this `KssParameter` is set.
 * Otherwise, the name of the `KssParameter` is returned.
 *
 * @param {string} name Optional. The name of the `KssParameter`.
 * @returns {string|KssParameter} If name is given, the current `KssParameter`
 *   object is returned to allow chaining of methods. Otherwise, the name of the
 *   `KssParameter` is returned.
 */
KssParameter.prototype.name = function(name) {
  if (typeof name !== 'undefined') {
    this.data.name = name;
    // Allow chaining.
    return this;
  } else {
    return this.data.name;
  }
};

/**
 * Gets or sets the description of the KssParameter.
 *
 * If the `description` is provided, the description of this `KssParameter` is set.
 * Otherwise, the description of the KssParameter is returned.
 *
 * @param {string} description Optional. The description of the KssParameter.
 * @returns {string|KssParameter} If description is given, the current
 *   KssParameter object is returned to allow chaining of methods. Otherwise,
 *   the description of the KssParameter is returned.
 */
KssParameter.prototype.description = function(description) {
  if (typeof description !== 'undefined') {
    this.data.description = description;
    // Allow chaining.
    return this;
  } else {
    return this.data.description;
  }
};

module.exports = KssParameter;
