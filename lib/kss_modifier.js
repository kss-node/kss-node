'use strict';

/**
 * The `kss/lib/kss_modifier` module is normally accessed via the
 * [`KssModifier()`]{@link module:kss.KssModifier} constructor of the `kss`
 * module:
 * ```
 * var KssModifier = require('kss').KssModifier;
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
    return new KssModifier(data);
  }

  data = data || {};

  this.meta = {};
  this.meta.section = data.section || null;

  this.data = {};
  this.data.name = data.name || '';
  this.data.description = data.description || '';
  this.data.className = data.className || false;
};

/**
 * Gets or sets the `KssSection` object this `KssModifier` is associated with.
 *
 * If the `section` value is provided, the `KssSection` for this modifier is
 * set. Otherwise, the `KssSection` of the modifier is returned.
 *
 * @param {KssSection} section Optional. The `KssSection` that owns the
 *   `KssModifier`.
 * @returns {KssSection|KssModifier} If section is given, the current
 *   `KssModifier` object is returned to allow chaining of methods. Otherwise,
 *   the `KssSection` object the modifier belongs to is returned.
 */
KssModifier.prototype.section = function(section) {
  if (typeof section === 'undefined') {
    return this.meta.section;
  }

  this.meta.section = section;
  // Allow chaining.
  return this;
};

/**
 * Gets or sets the name of the `KssModifier`, e.g. `:hover`, `.primary`, etc.
 *
 * If the `name` value is provided, the name of this `KssModifier` is set.
 * Otherwise, the name of the `KssModifier` is returned.
 *
 * @param {string} name Optional. The name of the `KssModifier`.
 * @returns {string|KssModifier} If name is given, the current `KssModifier`
 *   object is returned to allow chaining of methods. Otherwise, the name of the
 *   `KssModifier` is returned.
 */
KssModifier.prototype.name = function(name) {
  if (typeof name === 'undefined') {
    return this.data.name;
  }

  this.data.name = name;
  // Allow chaining.
  return this;
};

/**
 * Gets or sets the description of the `KssModifier`.
 *
 * If the `description` is provided, the description of this `KssModifier` is set.
 * Otherwise, the description of the `KssModifier` is returned.
 *
 * @param {string} description Optional. The description of the `KssModifier`.
 * @returns {string|KssModifier} If description is given, the current
 *   `KssModifier` object is returned to allow chaining of methods. Otherwise,
 *   the description of the `KssModifier` is returned.
 */
KssModifier.prototype.description = function(description) {
  if (typeof description === 'undefined') {
    return this.data.description;
  }

  this.data.description = description;
  // Allow chaining.
  return this;
};

/**
 * Gets or sets CSS class(es) suitable to insert into a markup sample to display
 * the modifier's design.
 *
 * By default, the CSS classes the className() method returns are based on the
 * modifier's name. If the modifier's name includes a pseudo-class, e.g.
 * `:hover`, this method will replace the ":" with "pseudo-class-", which
 * matches the selector expected by the kss.js script and its KssStateGenerator.
 *
 * ```
 * modifier.name('.primary:hover');
 * modifier.className(); // Returns "primary pseudo-class-hover"
 * ```
 *
 * To override, the default behavior the class(es) can also be set manually; if
 * the `className` parameter is provided, the className of this `KssModifier`
 * is set and will later be returned as-is instead of calculated based on the
 * `name()`.
 *
 * @param {string} className Optional. The class(es) of the `KssModifier`.
 * @returns {string|KssModifier} If the className parameter is given, the
 *   current `KssModifier` object is returned to allow chaining of methods.
 *   Otherwise, the class name(s) of the `KssModifier` are returned.
 */
KssModifier.prototype.className = function(className) {
  if (typeof className === 'undefined') {
    if (this.data.className) {
      return this.data.className;
    } else {
      var name = this.name().replace(/\:/g, '.pseudo-class-');

      if (!name) {
        return false;
      }

      // If the name includes child selectors, we only want the first parent
      // selector. Markup should not be multiple elements deep at this stage.
      name = name.split(/\s/)[0];

      // Split into space-separated classes.
      name = name
        .replace(/\./g, ' ')
        .replace(/^\s*/g, '');

      return name;
    }
  }

  this.data.className = className;
  // Allow chaining.
  return this;
};

/**
 * Returns the HTML markup used to render this modifier.
 *
 * The markup is retrieved from the KssModifier's section. See
 * `KssSection.markup()` to see how to set the markup.
 *
 * @returns {string} The markup of the modifier.
 */
KssModifier.prototype.markup = function() {
  if (!this.section()) {
    return '';
  }

  return (this.section().markup() || '');
};

/**
 * Return the `KssModifier` as a JSON object.
 *
 * @returns {Object} A JSON object representation of the `KssModifier`.
 */
KssModifier.prototype.toJSON = function() {
  return {
    name: this.name(),
    description: this.description(),
    className: this.className()
  };
};

module.exports = KssModifier;
