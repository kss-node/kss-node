'use strict';

const KssSection = require('./kss_section');

/**
 * The `kss/lib/kss_styleguide` module is normally accessed via the
 * [`KssStyleGuide()`]{@link module:kss.KssStyleGuide} class of the `kss`
 * module:
 * ```
 * const KssStyleGuide = require('kss').KssStyleGuide;
 * ```
 * @private
 * @module kss/lib/kss_styleguide
 */

/**
 * A KssStyleGuide object represents multi-section style guide.
 *
 * This class is normally accessed via the [`kss`]{@link module:kss} module:
 * ```
 * const KssStyleGuide = require('kss').KssStyleGuide;
 * ```
 *
 * @alias module:kss.KssStyleGuide
 */
class KssStyleGuide {

  /**
   * Creates a KssStyleGuide object and stores the given data.
   *
   * If passed an object, it will add `autoInit`, `customPropertyNames`, and
   * `sections` properties.
   *
   * @param {Object} [data] An object of data.
   */
  constructor(data) {
    data = data || {};

    this.meta = {
      autoInit: false,
      files: data.files || [],
      hasNumericReferences: true,
      needsDepth: false,
      needsReferenceNumber: false,
      needsSort: false,
      referenceDelimiter: '.',
      referenceMap: {},
      weightMap: {}
    };

    this.data = {
      customPropertyNames: [],
      sections: []
    };

    if (data.customPropertyNames) {
      this.customPropertyNames(data.customPropertyNames);
    }

    if (data.sections) {
      // Note that auto-initialization is temporarily off since we don't want to
      // init this new object until after these sections are added.
      this.sections(data.sections);
    }

    // Now that all sections are added, turn on auto-initialization. But allow a
    // flag passed to the constructor to turn off auto-initialization.
    if (data.autoInit !== false) {
      this.meta.autoInit = true;
    }

    if (this.meta.autoInit) {
      this.init();
    }
  }

  /**
   * Return the `KssStyleGuide` as a JSON object.
   *
   * @returns {Object} A JSON object representation of the KssStyleGuide.
   */
  toJSON() {
    let returnObject;

    returnObject = {
      customPropertyNames: this.customPropertyNames(),
      hasNumericReferences: this.hasNumericReferences(),
      referenceDelimiter: this.referenceDelimiter()
    };

    returnObject.sections = this.sections().map(section => {
      return section.toJSON();
    });

    return returnObject;
  }

  /**
   * Toggles the auto-initialization setting of this style guide.
   *
   * If a `false` value is provided, auto-initialization is disabled and users
   * will be required to call `init()` manually after adding sections via
   * `sections()`. If a `true' value is provided, auto-initialization will be
   * enabled and the `init()` method will immediately be called.
   *
   * @param {boolean} autoInit The new setting for auto-initialization.
   * @returns {KssStyleGuide} The `KssStyleGuide` object is returned to allow
   *   chaining of methods.
   */
  autoInit(autoInit) {
    this.meta.autoInit = !!autoInit;

    if (this.meta.autoInit) {
      this.init();
    }

    // Allow chaining.
    return this;
  }

  /**
   * Sorts the style guides sections and (re-)initializes some section values.
   *
   * Some section data is dependent on the state of the KssStyleGuide. When
   * sections are added with `sections()`, it determines what updates are needed.
   * If needed, this method:
   * - Calculates the depth of the reference for each section. e.g. Section 2.1.7
   *   has a depth of 3.
   * - Sorts all the sections by reference.
   * - Calculates a reference number if the style guide uses
   *   word-based references.
   *
   * By default this method is called automatically whenever new sections are
   * added to the style guide. This
   *
   * @returns {KssStyleGuide} Returns the `KssStyleGuide` object to allow chaining
   *   of methods.
   */
  init() {
    if (this.data.sections.length) {
      let numSections = this.data.sections.length;

      // The delimiter has changed, so recalculate the depth of each section's
      // reference.
      if (this.meta.needsDepth) {
        for (let i = 0; i < numSections; i++) {
          this.data.sections[i].depth(this.data.sections[i].reference().split(this.referenceDelimiter()).length);
        }
        this.meta.needsDepth = false;
      }

      // Sort all the sections.
      if (this.meta.needsSort) {
        let delimiter = this.referenceDelimiter();
        // Sorting helper function that gets the weight of the given reference at
        // the given depth. e.g. `getWeight('4.3.2.2', 2)` will return the weight
        // for section 4.3.
        let getWeight = (reference, depth) => {
          reference = reference.toLowerCase().split(delimiter, depth).join(delimiter);

          return this.meta.weightMap[reference] ? this.meta.weightMap[reference] : 0;
        };

        // Sort sections based on the references.
        this.data.sections.sort((a, b) => {
          // Split the 2 references into chunks by their period or dash separators.
          let refsA = a.reference().toLowerCase().split(delimiter),
            refsB = b.reference().toLowerCase().split(delimiter),
            weightA, weightB,
            maxRefLength = Math.max(refsA.length, refsB.length);

          // Compare each set of chunks until we know which reference should be listed first.
          for (let i = 0; i < maxRefLength; i++) {
            if (refsA[i] && refsB[i]) {
              // If the 2 chunks are unequal, compare them.
              if (refsA[i] !== refsB[i]) {
                // If the chunks have different weights, sort by weight.
                weightA = getWeight(a.reference(), i + 1);
                weightB = getWeight(b.reference(), i + 1);
                if (weightA !== weightB) {
                  return weightA - weightB;
                } else if (refsA[i].match(/^\d+$/) && refsB[i].match(/^\d+$/)) {
                  // If both chunks are digits, use numeric sorting.
                  return refsA[i] - refsB[i];
                } else {
                  // Otherwise, use alphabetical string sorting.
                  return (refsA[i] > refsB[i]) ? 1 : -1;
                }
              }
            } else {
              // If 1 of the chunks is empty, it goes first.
              return refsA[i] ? 1 : -1;
            }
          }

          return 0;
        });
        this.meta.needsSort = false;
      }

      // Create an auto-incremented reference number if the references are not
      // number-based references.
      if (this.meta.needsReferenceNumber) {
        let autoIncrement = [0], ref, previousRef = [];
        for (let i = 0; i < numSections; i++) {
          ref = this.data.sections[i].reference();

          // Compare the previous Ref to the new Ref.
          ref = ref.split(this.referenceDelimiter());
          // If they are already equal, we don't need to increment the section number.
          if (previousRef.join(this.referenceDelimiter()) !== ref.join(this.referenceDelimiter())) {
            let incrementIndex = 0;
            for (let index = 0; index < previousRef.length; index += 1) {
              // Find the index where the refs differ.
              if (index >= ref.length || previousRef[index] !== ref[index]) {
                break;
              }
              incrementIndex = index + 1;
            }
            if (incrementIndex < autoIncrement.length) {
              // Increment the part where the refs started to differ.
              autoIncrement[incrementIndex]++;
              // Trim off the extra parts of the autoincrement where the refs differed.
              autoIncrement = autoIncrement.slice(0, incrementIndex + 1);
            }
            // Add parts to the autoincrement to ensure it is the same length as the new ref.
            for (let index = autoIncrement.length; index < ref.length; index += 1) {
              autoIncrement[index] = 1;
            }
          }
          this.data.sections[i].referenceNumber(autoIncrement.join('.'));
          previousRef = ref;
        }
        this.meta.needsReferenceNumber = false;
      }
    }

    // Allow chaining.
    return this;
  }

  /**
   * Gets or sets the list of custom properties of the style guide.
   *
   * If the `names` value is provided, the names are added to the style guide's
   * list of custom properties. Otherwise, the style guide's list of custom
   * properties is returned.
   *
   * @param {string|string[]} [names] Optional. The names of  of the section.
   * @returns {KssStyleGuide|string[]} If `names` is given, the `KssStyleGuide`
   *   object is returned to allow chaining of methods. Otherwise, the list of
   *   custom properties of the style guide is returned.
   */
  customPropertyNames(names) {
    if (typeof names === 'undefined') {
      return this.data.customPropertyNames;
    }

    if (!(names instanceof Array)) {
      names = [names];
    }
    for (let i = 0; i < names.length; i++) {
      if (this.data.customPropertyNames.indexOf(names[i]) === -1) {
        this.data.customPropertyNames.push(names[i]);
      }
    }
    // Allow chaining.
    return this;
  }

  /**
   * Returns whether the style guide has numeric references or not.
   *
   * @returns {boolean} Whether the style guide has numeric references or not.
   */
  hasNumericReferences() {
    return this.meta.hasNumericReferences;
  }

  /**
   * Returns the delimiter used in the style guide's section references.
   *
   * @returns {string} The delimiter used in the section references.
   */
  referenceDelimiter() {
    return this.meta.referenceDelimiter;
  }

  /**
   * Gets or sets the sections of the style guide.
   *
   * If `sections` objects are provided, the sections are added to the style
   * guide. Otherwise, a search is performed to return the desired sections.
   *
   * There's a few ways to use search with this method:
   * - `sections()` returns all of the sections.
   *
   * Using strings:
   * - `sections('2')` returns Section 2.
   * - `sections('2.*')` returns Section 2 and all of its descendants.
   * - `sections('2.x')` returns Section 2's children only.
   * - `sections('2.x.x')` returns Section 2's children, and their children too.
   *
   * Or Regular Expressions:
   * - `sections(/2\.[1-5]/)` returns Sections 2.1 through to 2.5.
   *
   * @param {Object|Object[]|string|RegExp} [sections] Optional. A section object
   *   or array of secction objects to add to the style guide. Or a string or
   *   Regexp object to match a KssSection's style guide reference.
   * @returns {KssStyleGuide|KssSection|KssSection[]|boolean} If `sections` is
   *   given, the `KssStyleGuide` object is returned to allow chaining of methods.
   *   Otherwise, the exact KssSection requested, an array of KssSection objects
   *   matching the query, or false is returned.
   */
  sections(sections) {
    let query,
      matchedSections = [];

    if (typeof sections === 'undefined') {
      return this.data.sections;
    }

    // If we are given an object, assign the properties.
    if (typeof sections === 'object' && !(sections instanceof RegExp)) {
      if (!(sections instanceof Array)) {
        sections = [sections];
      }
      sections.forEach(section => {
        let originalDelimiter = this.referenceDelimiter();

        if (!(section instanceof KssSection)) {
          section = new KssSection(section);
        }

        // Set the style guide for each section.
        section.styleGuide(this);

        // Determine if the references are number-based or word-based.
        this.meta.hasNumericReferences = this.meta.hasNumericReferences && /^[\.\d]+$/.test(section.reference());
        // Store the reference for quick searching later.
        this.meta.referenceMap[section.reference()] = section;
        // Store the section's weight.
        this.meta.weightMap[section.reference().toLowerCase()] = section.weight();
        // Determine the separator used in references; e.g. 'a - b' or 'a.b'.
        if (section.reference().indexOf(' - ') > -1) {
          this.meta.referenceDelimiter = ' - ';
        }

        // Add the section to the style guide.
        this.data.sections.push(section);

        // If the delimiter changed, flag the depths as needing recalculation.
        if (originalDelimiter !== this.referenceDelimiter()) {
          this.meta.needsDepth = true;
        } else {
          // Set the depth of this section's reference.
          section.depth(section.reference().split(this.referenceDelimiter()).length);
        }

        // Determine if all sections need their reference number recalculated.
        if (!this.meta.hasNumericReferences) {
          this.meta.needsReferenceNumber = true;
        }

        // A new section means all sections need to be sorted.
        this.meta.needsSort = true;
      });

      // Automatically re-initialize the style guide.
      if (this.meta.autoInit) {
        this.init();
      }
      // Allow chaining.
      return this;
    }

    // Otherwise, we should search for the requested section.
    query = sections;

    // Exact queries.
    if (typeof query === 'string') {
      // If the query is '*', 'x', or ends with '.*', ' - *', '.x', or ' - x',
      // then it is not an exact query.
      if (!(/(^[x\*]$|\s\-\s[x\*]$|\.[x\*]$)/.test(query))) {
        if (this.meta.referenceMap[query]) {
          return this.meta.referenceMap[query];
        } else {
          return false;
        }
      }
    }

    // Convert regex strings into proper JavaScript RegExp objects.
    if (!(query instanceof RegExp)) {
      let delim = this.referenceDelimiter() === '.' ? '\\.' : '\\ \\-\\ ';
      query = new RegExp(
        query
        // Convert '*' to a simple .+ regex.
          .replace(/^\*$/, '.+')
          // Convert 'x' to a regex matching one level of reference.
          .replace(/^x$/, '^.+?(?=($|' + delim + '))')
          // Convert '.*' or ' - *' to a ([delim].+){0,1} regex.
          .replace(/(\.|\s+\-\s+)\*$/g, '(' + delim + '.+){0,1}')
          // Convert the first '.x' or ' - x' to a regex matching one sub-level
          // of a reference.
          .replace(/(\.|\s+\-\s+)x\b/, delim + '.+?(?=($|' + delim + '))')
          // Convert any remaining '.x' or ' - x' to a regex matching zero or one
          // sub-levels of a reference.
          .replace(/(\.|\s+\-\s+)x\b/g, '(' + delim + '.+?(?=($|' + delim + '))){0,1}')
          // Convert any remaining '-' into '\-'
          .replace(/([^\\])\-/g, '$1\\-')
      );
    }

    // General (regex) search
    for (let i = 0; i < this.data.sections.length; i += 1) {
      let match = this.data.sections[i].reference().match(query);
      // The regex must match the full reference.
      if (match && match[0] === this.data.sections[i].reference()) {
        matchedSections.push(this.data.sections[i]);
      }
    }

    return matchedSections;
  }
}

module.exports = KssStyleGuide;
