'use strict';

/**
 * The `kss/lib/kss_modifier` module is normally accessed via the
 * [`KssModifier()`]{@link module:kss.KssModifier} constructor of the `kss`
 * module:
 * ```
 * var kss = require('kss');
 * var modifier = new kss.KssModifier(data);
 * ```
 * @private
 * @module kss/lib/kss_modifier
 */

var KssModifier;

/**
 * An instance of this class is returned on calling `KssSection.modifier`.
 * Exposes convenience methods for interpreting data.
 *
 * @constructor
 * @alias module:kss.KssModifier
 * @param {Object} data A part of the data object passed on by `KssSection`.
 */
KssModifier = function(data) {
  if (!(this instanceof KssModifier)) {
    return new KssModifier();
  }
  this.data = data || {};
  this.data.markup = this.data.markup || '';
  this.init();
};

/**
 * Initializes the object and data passed to the constructor. Called
 * automatically from the KssModifier() constructor; should not be called
 * directly.
 * @private
 */
KssModifier.prototype.init = function() {
};

/**
 * Returns the `KssSection` object this modifier is associated with.
 * @returns {KssSection} The style guide section the modifier belongs to.
 */
KssModifier.prototype.section = function() {
  return this.data.section;
};

/**
 * Returns the name of the modifier, e.g. `:hover`, `.primary`, etc.
 * @returns {string} The name of the modifier.
 */
KssModifier.prototype.name = function() {
  return this.data.name;
};

/**
 * Returns the description of the modifier.
 * @returns {string} The description of the modifier.
 */
KssModifier.prototype.description = function() {
  return this.data.description;
};

/**
 * Returns the class name of the modifier.
 * @returns {string} The class name of the modifier.
 */
KssModifier.prototype.className = function() {
  var className = this.data.className;

  // Only get the first class combination -
  // Markup should not be multiple elements deep at this stage.
  className = className.split(/\s/);
  if (!className) {
    return false;
  }

  // Split into space-separated classes for inclusion
  // in templates etc.
  className = className[0]
    .replace(/\./g, ' ')
    .replace(/^\s*/g, '');

  return className;
};

/**
 * Returns the HTML markup used to render this modifier.
 * @returns {string} The markup of the modifier.
 */
KssModifier.prototype.markup = function() {
  if (!(this.data.section && this.data.section.markup)) {
    return false;
  }

  return (this.data.section.markup() || '');
};

module.exports = KssModifier;
