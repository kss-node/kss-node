'use strict';

/**
 * The `kss/lib/kss_parameter` module is normally accessed via the
 * [`KssParameter()`]{@link module:kss.KssParameter} class of the `kss` module:
 * ```
 * const KssParameter = require('kss').KssParameter;
 * ```
 * @private
 * @module kss/lib/kss_parameter
 */

/**
 * A KssParameter object represents a single parameter of a `KssSection`.
 *
 * This class is normally accessed via the [`kss`]{@link module:kss} module:
 * ```
 * const KssParameter = require('kss').KssParameter;
 * ```
 *
 * @alias module:kss.KssParameter
 */
class KssParameter {

  /**
   * Creates a KssParameter object and stores the given data.
   *
   * If passed an object, it will add `section`, `name`, and `description`
   * properties.
   *
   * @param {Object} [data] An object of data.
   */
  constructor(data) {
    data = data || {};

    this.meta = {
      section: null
    };

    this.data = {
      name: '',
      defaultValue: '',
      description: ''
    };

    // Loop through the given properties.
    for (let name in data) {
      // If the property is defined in this.data or this.meta, add it via our API.
      if (data.hasOwnProperty(name) && (this.data.hasOwnProperty(name) || this.meta.hasOwnProperty(name))) {
        this[name](data[name]);
      }
    }
  }

  /**
   * Gets or sets the `KssSection` object this `KssParameter` is associated with.
   *
   * If the `section` value is provided, the `KssSection` for this parameter is
   * set. Otherwise, the `KssSection` of the parameter is returned.
   *
   * @param {KssSection} [section] Optional. The `KssSection` that owns the
   *   `KssParameter`.
   * @returns {KssSection|KssParameter} If section is given, the current
   *   `KssParameter` object is returned to allow chaining of methods. Otherwise,
   *   the `KssSection` object the parameter belongs to is returned.
   */
  section(section) {
    if (typeof section === 'undefined') {
      return this.meta.section;
    }

    this.meta.section = section;
    // Allow chaining.
    return this;
  }

  /**
   * Gets or sets the name of the `KssParameter`.
   *
   * If the `name` value is provided, the name of this `KssParameter` is set.
   * Otherwise, the name of the `KssParameter` is returned.
   *
   * @param {string} [name] Optional. The name of the `KssParameter`.
   * @returns {string|KssParameter} If name is given, the current `KssParameter`
   *   object is returned to allow chaining of methods. Otherwise, the name of the
   *   `KssParameter` is returned.
   */
  name(name) {
    if (typeof name === 'undefined') {
      return this.data.name;
    }

    this.data.name = name;
    // Allow chaining.
    return this;
  }

  /**
   * Gets or sets the default value of the `KssParameter`.
   *
   * If the `defaultValue` value is provided, the default value of this
   * `KssParameter` is set. Otherwise, the default value of the `KssParameter` is
   * returned.
   *
   * @param {string} defaultValue Optional. The default value of the
   *   `KssParameter`.
   * @returns {string|KssParameter} If `defaultValue` is given, the current
   *   `KssParameter` object is returned to allow chaining of methods. Otherwise,
   *   the default value of the `KssParameter` is returned.
   */
  defaultValue(defaultValue) {
    if (typeof defaultValue !== 'undefined') {
      this.data.defaultValue = defaultValue;
      // Allow chaining.
      return this;
    } else {
      return this.data.defaultValue;
    }
  }

  /**
   * Gets or sets the description of the `KssParameter`.
   *
   * If the `description` is provided, the description of this `KssParameter` is set.
   * Otherwise, the description of the `KssParameter` is returned.
   *
   * @param {string} [description] Optional. The description of the `KssParameter`.
   * @returns {string|KssParameter} If description is given, the current
   *   `KssParameter` object is returned to allow chaining of methods. Otherwise,
   *   the description of the `KssParameter` is returned.
   */
  description(description) {
    if (typeof description === 'undefined') {
      return this.data.description;
    }

    this.data.description = description;
    // Allow chaining.
    return this;
  }

  /**
   * Return the `KssParameter` as a JSON object.
   *
   * @returns {Object} A JSON object representation of the `KssParameter`.
   */
  toJSON() {
    return {
      name: this.name(),
      defaultValue: this.defaultValue(),
      description: this.description()
    };
  }
}

module.exports = KssParameter;
