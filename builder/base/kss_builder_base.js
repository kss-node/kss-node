'use strict';

/**
 * The `kss/builder/base` module loads the {@link KssBuilderBase} class.
 * ```
 * const KssBuilderBase = require('kss/builder/base');
 * ```
 * @module kss/builder/base
 */

/* ***************************************************************
   See kss_builder_base_example.js for how to implement a builder.
   *************************************************************** */

const path = require('path'),
  Promise = require('bluebird');

const fs = Promise.promisifyAll(require('fs-extra')),
  kssBuilderAPI = '3.0';

/**
 * A kss-node builder takes input files and builds a style guide.
 */
class KssBuilderBase {

  /**
   * Create a KssBuilderBase object.
   *
   * This is the base object used by all kss-node builders.
   *
   * ```
   * const KssBuilderBase = require('kss/builder/base');
   * class KssBuilderCustom extends KssBuilderBase {
   *   // Override methods of KssBuilderBase.
   * }
   * ```
   */
  constructor() {
    this.optionDefinitions = {};
    this.options = {};

    // Store the version of the builder API that the builder instance is
    // expecting; we will verify this in loadBuilder().
    this.API = 'undefined';

    // The log function defaults to console.log.
    this.setLogFunction(console.log);

    // The error logging function defaults to console.error.
    this.setLogErrorFunction(console.error);

    // Tell kss-node which Yargs-like options this builder has.
    this.addOptionDefinitions({
      source: {
        group: 'File locations:',
        string: true,
        path: true,
        describe: 'Source directory to parse for KSS comments'
      },
      destination: {
        group: 'File locations:',
        string: true,
        path: true,
        multiple: false,
        describe: 'Destination directory of style guide',
        default: 'styleguide'
      },
      mask: {
        group: 'File locations:',
        alias: 'm',
        string: true,
        multiple: false,
        describe: 'Use a mask for detecting files containing KSS comments',
        default: '*.css|*.less|*.sass|*.scss|*.styl|*.stylus'
      },

      clone: {
        group: 'Builder:',
        string: true,
        path: true,
        multiple: false,
        describe: 'Clone a style guide builder to customize'
      },
      builder: {
        group: 'Builder:',
        alias: 'b',
        string: true,
        path: true,
        multiple: false,
        describe: 'Use the specified builder when building your style guide',
        default: path.relative(process.cwd(), path.join(__dirname, '..', 'handlebars'))
      },
      css: {
        group: 'Style guide:',
        string: true,
        describe: 'URL of a CSS file to include in the style guide'
      },
      js: {
        group: 'Style guide:',
        string: true,
        describe: 'URL of a JavaScript file to include in the style guide'
      },
      custom: {
        group: 'Style guide:',
        string: true,
        describe: 'Process a custom property name when parsing KSS comments'
      },
      breakpoint: {
        group: 'Style guide:',
        string: true,
        describe: 'A list of responsive breakpoints to simulate'
      },

      verbose: {
        count: true,
        multiple: false,
        describe: 'Display verbose details while building'
      }
    });
  }

  /**
   * Loads the builder from the given file path or class.
   *
   * Call this static method to load the builder and verify the builder
   * implements the correct builder API version.
   *
   * @param {string|function} builderClass The path to a builder or a builder
   *   class to load.
   * @returns {Promise.<KssBuilder>} A `Promise` object resolving to a
   *   `KssBuilder` object, or one of its sub-classes.
   */
  static loadBuilder(builderClass) {
    return new Promise((resolve, reject) => {
      let newBuilder = {},
        SomeBuilder,
        isCompatible = true,
        builderAPI = 'undefined';

      try {
        // The parameter can be a class or constructor function.
        if (typeof builderClass === 'function') {
          SomeBuilder = builderClass;

        // If the parameter is a path, try to load the module.
        } else if (typeof builderClass === 'string') {
          SomeBuilder = require(path.resolve(builderClass));

        // Unexpected parameter.
        } else {
          return reject(new Error('Unexpected value for "builder"; should be a path to a module or a JavaScript Class.'));
        }

        // Check for a kss-node 2.0 template and KssGenenerator. Template's were
        // objects that provided the builder (generator) as a property.
        if (typeof SomeBuilder === 'object'
          && SomeBuilder.hasOwnProperty('generator')
          && SomeBuilder.generator.hasOwnProperty('implementsAPI')) {
          isCompatible = false;
          builderAPI = SomeBuilder.generator.implementsAPI;

        // Try to create a new builder.
        } else {
          newBuilder = new SomeBuilder();
        }

      } catch (e) {
        // Builders don't have to export their own builder class. If the builder
        // fails to export a builder class, we assume it wanted the default
        // builder. If the loader fails when given a string, we check if the
        // caller (either cli.js or kss.js) wanted the Twig builder and let the
        // caller recover from the thrown error.
        // istanbul ignore if
        if (builderClass === 'builder/twig') {
          return reject(new Error('The specified builder, "builder/twig", is not relative to the current working directory.'));
        } else {
          let KssBuilderHandlebars = require('../handlebars');
          newBuilder = new KssBuilderHandlebars();
        }
      }

      // Grab the builder API version.
      if (newBuilder.hasOwnProperty('API')) {
        builderAPI = newBuilder.API;
      }

      // Ensure KssBuilderBase is the base class.
      if (!(newBuilder instanceof KssBuilderBase)) {
        isCompatible = false;
      } else if (builderAPI.indexOf('.') === -1) {
        isCompatible = false;
      } else {
        let version = kssBuilderAPI.split('.');
        let apiMajor = parseInt(version[0]);
        let apiMinor = parseInt(version[1]);

        version = builderAPI.split('.');
        let builderMajor = parseInt(version[0]);
        let builderMinor = parseInt(version[1]);

        if (builderMajor !== apiMajor || builderMinor > apiMinor) {
          isCompatible = false;
        }
      }

      if (!isCompatible) {
        return reject(new Error('kss expected the builder to implement KssBuilderBase API version ' + kssBuilderAPI + '; version "' + builderAPI + '" is being used instead.'));
      }

      return resolve(newBuilder);
    });
  }

  /**
   * Stores the given options.
   *
   * @param {Object} options An object of options to store.
   * @returns {KssBuilderBase} The `KssBuilderBase` object is returned to allow
   *   chaining of methods.
   */
  addOptions(options) {
    for (let key in options) {
      // istanbul ignore else
      if (options.hasOwnProperty(key)) {
        this.options[key] = options[key];
      }
    }

    // Set the logging functions of the builder.
    if (typeof options.logFunction === 'function') {
      this.setLogFunction(options.logFunction);
    }
    if (typeof options.logErrorFunction === 'function') {
      this.setLogErrorFunction(options.logErrorFunction);
    }

    // Allow clone to be used without a path. We can't specify this default path
    // in the option definition or the clone flag would always be "on".
    if (options.clone === '' || options.clone === true) {
      this.options.clone = 'custom-builder';
    }

    // Allow chaining.
    return this.normalizeOptions(Object.keys(options));
  }

  /**
   * Returns the requested option or, if no key is specified, an object
   * containing all options.
   *
   * @param {string} [key] Optional name of the option to return.
   * @returns {*} The specified option or an object of all options.
   */
  getOptions(key) {
    return key ? this.options[key] : this.options;
  }

  /**
   * Adds option definitions to the builder.
   *
   * Since kss-node is extensible, builders can define their own options that
   * users can configure.
   *
   * Each option definition object is key-compatble with
   * [yargs](https://www.npmjs.com/package/yargs), the command-line utility
   * used by kss-node's command line tool.
   *
   * If an option definition object has a:
   * - `multiple` property: if set to `false`, the corresponding option will be
   *   normalized to a single value. Otherwise, it will be normalized to an
   *   array of values.
   * - `path` property: if set to `true`, the corresponding option will be
   *   normalized to a path, relative to the current working directory.
   * - `default` property: the corresponding option will default to this value.
   *
   * @param {object} optionDefinitions An object of option definitions.
   * @returns {KssBuilderBase} The `KssBuilderBase` object is returned to allow
   *   chaining of methods.
   */
  addOptionDefinitions(optionDefinitions) {
    for (let key in optionDefinitions) {
      // istanbul ignore else
      if (optionDefinitions.hasOwnProperty(key)) {
        // The "multiple" property defaults to true.
        if (typeof optionDefinitions[key].multiple === 'undefined') {
          optionDefinitions[key].multiple = true;
        }
        // The "path" property defaults to false.
        if (typeof optionDefinitions[key].path === 'undefined') {
          optionDefinitions[key].path = false;
        }
        this.optionDefinitions[key] = optionDefinitions[key];
      }
    }

    // Allow chaining.
    return this.normalizeOptions(Object.keys(optionDefinitions));
  }

  /**
   * Returns the requested option definition or, if no key is specified, an
   * object containing all option definitions.
   *
   * @param {string} [key] Optional name of option to return.
   * @returns {*} The specified option definition or an object of all option
   *   definitions.
   */
  getOptionDefinitions(key) {
    return key ? this.optionDefinitions[key] : this.optionDefinitions;
  }

  /**
   * Normalizes the options so that they are easy to use inside KSS.
   *
   * The option definitions specified with `addOptionDefinitions()` determine
   * how the options will be normalized.
   *
   * @private
   * @param {string[]} keys The keys to normalize.
   * @returns {KssBuilderBase} The `KssBuilderBase` object is returned to allow
   *   chaining of methods.
   */
  normalizeOptions(keys) {
    for (let key of keys) {
      if (typeof this.optionDefinitions[key] !== 'undefined') {
        if (typeof this.options[key] === 'undefined') {
          // Set the default setting.
          if (typeof this.optionDefinitions[key].default !== 'undefined') {
            this.options[key] = this.optionDefinitions[key].default;
          }
        }
        // If an option is specified multiple times, yargs will convert it into
        // an array, but leave it as a string otherwise. This makes accessing
        // the options inconsistent, so we make these options an array.
        if (this.optionDefinitions[key].multiple) {
          if (!(this.options[key] instanceof Array)) {
            if (typeof this.options[key] === 'undefined') {
              this.options[key] = [];
            } else {
              this.options[key] = [this.options[key]];
            }
          }
        } else {
          // For options marked as "multiple: false", use the last value
          // specified, ignoring the others.
          if (this.options[key] instanceof Array) {
            this.options[key] = this.options[key].pop();
          }
        }
        // Resolve any paths relative to the working directory.
        if (this.optionDefinitions[key].path) {
          if (this.options[key] instanceof Array) {
            /* eslint-disable no-loop-func */
            this.options[key] = this.options[key].map(value => {
              return path.resolve(value);
            });
            /* eslint-enable no-loop-func */
          } else if (typeof this.options[key] === 'string') {
            this.options[key] = path.resolve(this.options[key]);
          }
        }
      }
    }

    // Allow chaining.
    return this;
  }

  /* eslint-disable no-unused-vars */
  /**
   * Logs a message to be reported to the user.
   *
   * Since a builder can be used in places other than the console, using
   * console.log() is inappropriate. The log() method should be used to pass
   * messages to the KSS system so it can report them to the user.
   *
   * @param {...string} message The message to log.
   * @returns {KssBuilderBase} The `KssBuilderBase` object is returned to allow
   *   chaining of methods.
   */
  log(message) {
    /* eslint-enable no-unused-vars */
    this.logFunction.apply(null, arguments);

    // Allow chaining.
    return this;
  }

  /**
   * The `log()` method logs a message for the user. This method allows the
   * system to define the underlying function used by the log method to report
   * the message to the user. The default log function is a wrapper around
   * `console.log()`.
   *
   * @param {Function} logFunction Function to log a message to the user.
   * @returns {KssBuilderBase} The `KssBuilderBase` object is returned to allow
   *   chaining of methods.
   */
  setLogFunction(logFunction) {
    this.logFunction = logFunction;

    // Allow chaining.
    return this;
  }

  /* eslint-disable no-unused-vars */
  /**
   * Logs an error to be reported to the user.
   *
   * Since a builder can be used in places other than the console, using
   * console.error() is inappropriate. The logError() method should be used to
   * pass error messages to the KSS system so it can report them to the user.
   *
   * @param {Error} error The error to log.
   * @returns {KssBuilderBase} The `KssBuilderBase` object is returned to allow
   *   chaining of methods.
   */
  logError(error) {
    /* eslint-enable no-unused-vars */
    this.logErrorFunction.apply(null, arguments);

    // Allow chaining.
    return this;
  }

  /**
   * The `error()` method logs an error message for the user. This method allows
   * the system to define the underlying function used by the error method to
   * report the error message to the user. The default log error function is a
   * wrapper around `console.error()`.
   *
   * @param {Function} logErrorFunction Function to log a message to the user.
   * @returns {KssBuilderBase} The `KssBuilderBase` object is returned to allow
   *   chaining of methods.
   */
  setLogErrorFunction(logErrorFunction) {
    this.logErrorFunction = logErrorFunction;

    // Allow chaining.
    return this;
  }

  /**
   * Clone a builder's files.
   *
   * This method is fairly simple; it copies one directory to the specified
   * location. A sub-class of KssBuilderBase does not need to override this
   * method, but it can if it needs to do something more complicated.
   *
   * @param {string} builderPath Path to the builder to clone.
   * @param {string} destinationPath Path to the destination of the newly cloned
   *   builder.
   * @returns {Promise.<null>} A `Promise` object resolving to `null`.
   */
  clone(builderPath, destinationPath) {
    return fs.statAsync(destinationPath).catch(error => {
      // Pass the error on to the next .then().
      return error;
    }).then(result => {
      // If we successfully get stats, the destination exists.
      if (!(result instanceof Error)) {
        return Promise.reject(new Error('This folder already exists: ' + destinationPath));
      }

      // If the destination path does not exist, we copy the builder to it.
      // istanbul ignore else
      if (result.code === 'ENOENT') {
        return fs.copyAsync(
          builderPath,
          destinationPath,
          {
            clobber: true,
            filter: filePath => {
              // Only look at the part of the path inside the builder.
              let relativePath = path.sep + path.relative(builderPath, filePath);
              // Skip any files with a path matching: /node_modules or /.
              return (new RegExp('^(?!.*\\' + path.sep + '(node_modules$|\\.))')).test(relativePath);
            }
          }
        );
      } else {
        // Otherwise, report the error.
        return Promise.reject(result);
      }
    });
  }

  /**
   * Allow the builder to preform pre-build tasks or modify the KssStyleGuide
   * object.
   *
   * The method can be set by any KssBuilderBase sub-class to do any custom
   * tasks after the KssStyleGuide object is created and before the HTML style
   * guide is built.
   *
   * @param {KssStyleGuide} styleGuide The KSS style guide in object format.
   * @returns {Promise.<KssStyleGuide>} A `Promise` object resolving to a
   *   `KssStyleGuide` object.
   */
  prepare(styleGuide) {
    let sectionReferences,
      newSections = [],
      delim = styleGuide.referenceDelimiter();

    // Create a list of references in the style guide.
    sectionReferences = styleGuide.sections().map(section => {
      return section.reference();
    });

    // Return an error if no KSS sections are found.
    if (sectionReferences.length === 0) {
      return Promise.reject(new Error('No KSS documentation discovered in source files.'));
    }

    sectionReferences.forEach(reference => {
      let refParts = reference.split(delim),
        checkReference = '';
      // Split the reference into parts and ensure there are existing sections
      // for each level of the reference. e.g. For "a.b.c", check for existing
      // sections for "a" and "a.b".
      for (let i = 0; i < refParts.length - 1; i++) {
        checkReference += (checkReference ? delim : '') + refParts[i];
        if (sectionReferences.indexOf(checkReference) === -1 && newSections.indexOf(checkReference) === -1) {
          newSections.push(checkReference);
          // Add the missing section to the style guide.
          styleGuide
            .autoInit(false)
            .sections({
              header: checkReference,
              reference: checkReference
            });
        }
      }
    });

    // Re-init the style guide if we added new sections.
    if (newSections.length) {
      styleGuide.autoInit(true);
    }

    return Promise.resolve(styleGuide);
  }

  /**
   * Build the HTML files of the style guide given a KssStyleGuide object.
   *
   * @param {KssStyleGuide} styleGuide The KSS style guide in object format.
   * @returns {Promise.<KssStyleGuide>} A `Promise` object resolving to a
   *   `KssStyleGuide` object.
   */
  build(styleGuide) {
    return Promise.resolve(styleGuide);
  }
}

module.exports = KssBuilderBase;
