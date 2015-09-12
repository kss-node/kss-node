'use strict';

/**
 * The `kss/lib/kss_section` module is normally accessed via the
 * [`KssSection()`]{@link module:kss.KssSection} constructor of the `kss`
 * module:
 * ```
 * var kss = require('kss');
 * var section = new kss.KssSection(data);
 * ```
 * @private
 * @module kss/lib/kss_section
 */

var KssSection;

/**
 * An instance of this class is returned on calling `KssStyleguide.section`.
 * Exposes convenience methods for interpreting data.
 *
 * @constructor
 * @alias module:kss.KssSection
 * @param {Object} data A part of the data object passed on by `KssStyleguide`.
 */
KssSection = function(data) {
  if (!(this instanceof KssSection)) {
    return new KssSection();
  }
  this.data = data || {};
  this.init();
};

/**
 * Initializes the object and data passed to the constructor. Called
 * automatically from the KssSection() constructor; should not be called
 * directly.
 * @private
 */
KssSection.prototype.init = function() {
  var self = this;

  this.styleguide = this.data.styleguide || null;

  this.data.header = this.data.header || '';
  this.data.description = this.data.description || '';
  this.data.deprecated = this.data.deprecated || false;
  this.data.experimental = this.data.experimental || false;
  this.data.reference = this.data.reference || '';
  this.data.depth = this.data.depth || 0;
  this.data.weight = this.data.weight || 0;
  this.data.referenceURI = this.data.referenceURI || '';
  this.data.markup = this.data.markup || '';

  if (this.data.modifiers) {
    this.data.modifiers = this.data.modifiers.map(function(modifier) {
      modifier.data.section = self;
      return modifier;
    });
  } else {
    this.data.modifiers = [];
  }

  if (this.data.parameters) {
    this.data.parameters = this.data.parameters.map(function(parameter) {
      parameter.data.section = self;
      return parameter;
    });
  } else {
    this.data.parameters = [];
  }
};

/**
 * Return `KssSection` as a JSON object.
 *
 * @param {Array} customProperties A list of custom properties to include in the JSON.
 * @returns {Object} A JSON object representation of the KssSection.
 */
KssSection.prototype.toJSON = function(customProperties) {
  var returnObject;

  customProperties = customProperties || [];

  /* eslint-disable key-spacing */
  returnObject = {
    autoincrement:  this.data.autoincrement,
    header:         this.header(),
    description:    this.description(),
    deprecated:     this.deprecated(),
    experimental:   this.experimental(),
    reference:      this.reference(),
    depth:          this.depth(),
    weight:         this.weight(),
    referenceURI:   this.referenceURI(),
    markup:         this.markup()
  };
  /* eslint-enable key-spacing */

  returnObject.modifiers = this.data.modifiers.map(function(modifier) {
    return {
      name: modifier.name(),
      description: modifier.description(),
      className: modifier.className()
    };
  });
  returnObject.parameters = this.data.parameters.map(function(modifier) {
    return {
      name: modifier.name(),
      description: modifier.description()
    };
  });

  // Add custom properties to the JSON object.
  for (var i = 0; i < customProperties.length; i++) {
    if (this.data[customProperties[i]]) {
      returnObject[customProperties[i]] = this.data[customProperties[i]];
    }
  }

  return returnObject;
};

// DEPRECATED; use toJSON() instead.
/* istanbul ignore next */
KssSection.prototype.JSON = function(customProperties) {
  return this.toJSON(customProperties);
};

/**
 * Returns the header of the section, i.e. the first line in the description.
 * @returns {string} The header of the section.
 */
KssSection.prototype.header = function() {
  return this.data.header;
};

/**
 * Returns the description of the section.
 *
 * Note: If the multiline option is disabled this will include the header also.
 *
 * @returns {string} The description of the section.
 */
KssSection.prototype.description = function() {
  return this.data.description;
};

/**
 * Returns whether the section is deprecated or not.
 * @returns {Boolean} Whether the section is deprecated or not.
 */
KssSection.prototype.deprecated = function() {
  return this.data.deprecated;
};

/**
 * Returns whether the section is experimental or not.
 * @returns {Boolean} Whether the section is experimental or not.
 */
KssSection.prototype.experimental = function() {
  return this.data.experimental;
};

/**
 * Returns the reference of the section.
 * @returns {string} The reference of the section.
 */
KssSection.prototype.reference = function() {
  return this.data.reference;
};

/**
 * Returns the depth of the section.
 * @returns {string} The depth of the section.
 */
KssSection.prototype.depth = function() {
  return this.data.depth;
};

/**
 * Returns the weight of the section.
 * @returns {string} The weight of the section.
 */
KssSection.prototype.weight = function() {
  return this.data.weight ? this.data.weight : 0;
};

/**
 * Encodes the given reference as a valid URI fragment.
 * @param {string} reference A style guide section reference.
 * @returns {string} The reference encoded as a URI.
 */
KssSection.prototype.encodeReferenceURI = function(reference) {
  return encodeURI(
    reference
      .replace(/ \- /g, '-')
      .replace(/[^\w-]+/g, '-')
      .toLowerCase()
  );
};

/**
 * Returns the reference of the section, encoded as a valid URI fragment.
 * @returns {string} The description of the section.
 */
KssSection.prototype.referenceURI = function() {
  return this.data.referenceURI;
};

/**
 * Returns the markup of the section.
 * @returns {false|string} The markup of the section, or `false` if none.
 */
KssSection.prototype.markup = function() {
  return this.data.markup || false;
};

/**
 * Returns the requested modifier of the section.
 *
 * Different arguments will yield different results:
 *
 * - `modifiers()`: Pass nothing to return all of the section's modifiers in an
 *   array.
 * - `modifiers(n)`: Use a number to return the section's Nth modifier.
 * - `modifiers('name')`: Use a string to return a specific modifer by name.
 *
 * @param {string|int} query The name (string) or 0-based index (int) of the requested modifier.
 * @returns {false|Array} An Array of KssModifier objects, or `false` if none.
 */
KssSection.prototype.modifiers = function(query) {
  var number, i, l;

  if (typeof query === 'string') {
    number = parseFloat(query);

    // If can be converted to a number, convert and search
    // for the query by index (see below).
    if (number.toString() === query) {
      query = number;
    } else {
      // Otherwise, search for the modifier by name:
      l = this.data.modifiers.length;
      for (i = 0; i < l; i += 1) {
        if (this.data.modifiers[i].data.name === query) {
          return this.data.modifiers[i];
        }
      }
      return false;
    }
  }

  if (typeof query === 'number') {
    return this.data.modifiers.length > query ? this.data.modifiers[query] : false;
  }

  return this.data.modifiers;
};

/**
 * Returns the first modifier of the section.
 * @returns {false|string} The first modifier of the section, or `false` if none.
 */
KssSection.prototype.firstModifier = function() {
  if (this.data.modifiers.length) {
    return this.data.modifiers[0];
  } else {
    return false;
  }
};

/**
 * Returns the parameters if the section is a CSS preprocessor function/mixin.
 * @returns {Array} The parameters of the section.
 */
KssSection.prototype.parameters = function() {
  return this.data.parameters;
};

module.exports = KssSection;
