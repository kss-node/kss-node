'use strict';

/**
 * The `kss/lib/kss_modifier` module is normally accessed via the
 * [`KssModifier()`]{@link module:kss.KssModifier} class of the `kss` module:
 * ```
 * const KssModifier = require('kss').KssModifier;
 * ```
 * @private
 * @module kss/lib/kss_modifier
 */

/**
 * A KssModifier object represents a single modifier of a `KssSection`.
 *
 * This class is normally accessed via the [`kss`]{@link module:kss} module:
 * ```
 * const KssModifier = require('kss').KssModifier;
 * ```
 *
 * @alias module:kss.KssModifier
 */
class KssModifier {

  /**
   * Creates a KssModifier object and stores the given data.
   *
   * If passed an object, it will add `section`, `name`, `description`, and
   * `className` properties.
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
      description: '',
      className: ''
    };

    // Loop through the given properties.
    for (let name in data) {
      // If the property is defined in this.data or this.meta, add it via our
      // API.
      if (data.hasOwnProperty(name) && (this.data.hasOwnProperty(name) || this.meta.hasOwnProperty(name))) {
        this[name](data[name]);
      }
    }
  }

  /**
   * Gets or sets the `KssSection` object this `KssModifier` is associated with.
   *
   * If the `section` value is provided, the `KssSection` for this modifier is
   * set. Otherwise, the `KssSection` of the modifier is returned.
   *
   * @param {KssSection} [section] Optional. The `KssSection` that owns the
   *   `KssModifier`.
   * @returns {KssSection|KssModifier} If section is given, the current
   *   `KssModifier` object is returned to allow chaining of methods. Otherwise,
   *   the `KssSection` object the modifier belongs to is returned.
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
   * Gets or sets the name of the `KssModifier`, e.g. `:hover`, `.primary`, etc.
   *
   * If the `name` value is provided, the name of this `KssModifier` is set.
   * Otherwise, the name of the `KssModifier` is returned.
   *
   * @param {string} [name] Optional. The name of the `KssModifier`.
   * @returns {string|KssModifier} If name is given, the current `KssModifier`
   *   object is returned to allow chaining of methods. Otherwise, the name of
   *   the `KssModifier` is returned.
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
   * Gets or sets the description of the `KssModifier`.
   *
   * If the `description` is provided, the description of this `KssModifier` is
   * set. Otherwise, the description of the `KssModifier` is returned.
   *
   * @param {string} [description] Optional. The description of the
   *   `KssModifier`.
   * @returns {string|KssModifier} If description is given, the current
   *   `KssModifier` object is returned to allow chaining of methods. Otherwise,
   *   the description of the `KssModifier` is returned.
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
   * Gets or sets CSS class(es) suitable to insert into a markup sample to
   * display the modifier's design.
   *
   * By default, the CSS classes the className() method returns are based on the
   * modifier's name. If the modifier's name includes a pseudo-class, e.g.
   * `:hover`, this method will replace the ":" with "pseudo-class-", which
   * matches the selector expected by the kss.js script and its
   * KssStateGenerator.
   *
   * ```
   * modifier.name('.primary:hover');
   * modifier.className(); // Returns "primary pseudo-class-hover"
   * ```
   *
   * To override, the default behavior the class(es) can also be set manually;
   * if the `className` parameter is provided, the className of this
   * `KssModifier` is set and will later be returned as-is instead of calculated
   * based on the `name()`.
   *
   * @param {string} [className] Optional. The class(es) of the `KssModifier`.
   * @returns {string|KssModifier} If the className parameter is given, the
   *   current `KssModifier` object is returned to allow chaining of methods.
   *   Otherwise, the class name(s) of the `KssModifier` are returned.
   */
  className(className) {
    if (typeof className === 'undefined') {
      if (this.data.className) {
        return this.data.className;
      } else {
        let name = this.name().replace(/:/g, '.pseudo-class-');

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
  }

  parse(classes, attributes) {
    this.data.classes = (typeof classes !== 'undefined') ? classes : '';
    this.data.attributes = (typeof attributes !== 'undefined') ? attributes : '';

    let classesArray = [];
    let attributesArray = [];

    let selector = this.name();

    // If the name includes child selectors, we only want the first parent
    // selector. Markup should not be multiple elements deep at this stage.
    selector = selector.split(/\s/)[0];

    // remove :not()
    selector = selector.replace(/:not\(.+\)$/, '');

    // find classes
    let classesMatch = /\.-?[_a-zA-Z]+[_a-zA-Z0-9-]*/g.exec(selector);
    if (classesMatch !== null) {
      classesMatch.forEach((el) => {
        classesArray.push(el.substring(1, el.length)); // remove `.`
      });

      classesArray = classesMatch;
    }

    let pseudoClassesAttributesMatch = /:(?:required|disabled|read-only)*/g.exec(selector);
    if (pseudoClassesAttributesMatch !== null) {
      pseudoClassesAttributesMatch.forEach((el) => {
        attributesArray.push(el.substring(1, el.length)); // remove `:`
      });
    }

    this.data.classes = classesArray.join(' ');

    // find attributes
    let attributesMatch = /\[([a-zA-Z]+[a-zA-Z0-9-]*(?:=(?:".*?"|.*?))?)\]/g.exec(selector);
    if (attributesMatch !== null) {
      attributesMatch.forEach((el, i) => {
        // remove `[` and `]` then add quotes if missing
        attributesArray.push(el.substring(1, el.length - 1).replace(/=((?!").+?(?!"))$/, '="$1"'));
      });
    }

    this.data.attributes = attributesArray.join(' ');

    return this;
  }

  /**
   * Returns the HTML markup used to render this modifier.
   *
   * The markup is retrieved from the KssModifier's section. See
   * `KssSection.markup()` to see how to set the markup.
   *
   * @returns {string} The markup of the modifier.
   */
  markup() {
    if (!this.section()) {
      return '';
    }

    return (this.section().markup() || '');
  }

  /**
   * Return the `KssModifier` as a JSON object.
   *
   * @returns {Object} A JSON object representation of the `KssModifier`.
   */
  toJSON() {
    return {
      name: this.name(),
      description: this.description(),
      className: this.className()
    };
  }
}

module.exports = KssModifier;
