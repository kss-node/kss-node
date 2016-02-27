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

const coreOptions = {
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

  verbose: {
    count: true,
    multiple: false,
    describe: 'Display verbose details while building'
  }
};

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
   *
   * @param {object} [options] The Yargs-like options this builder has.
   *   See https://github.com/bcoe/yargs/blob/master/README.md#optionskey-opt
   */
  constructor(options) {
    options = options || {};

    this.options = {};
    this.config = {};

    // Store the version of the builder API that the builder instance is
    // expecting; we will verify this in checkBuilder().
    this.API = 'undefined';

    // Tell kss-node which Yargs-like options this builder has.
    this.addOptions(coreOptions);
    this.addOptions(options);

    // The log function defaults to console.log.
    this.setLogFunction(console.log);
  }

  /**
   * Checks the builder configuration.
   *
   * An instance of KssBuilderBase MUST NOT override this method. A process
   * controlling the builder should call this method to verify the specified
   * builder has been configured correctly.
   *
   * @param {Object} builder The builder to check.
   * @returns {Promise} A `Promise` object resolving to `null`.
   */
  static checkBuilder(builder) {
    let isCompatible = true,
      builderAPI = (typeof builder.API === 'string') ? builder.API : 'undefined';

    // Ensure KssBuilderBase is the base class.
    if (!(builder instanceof KssBuilderBase)) {
      isCompatible = false;
      // kss-node 2.0 template's provided the builder as a property.
      // istanbul ignore else
      if (builder.builder && builder.builder.API) {
        builderAPI = builder.builder.API;
      }
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
      return Promise.reject(new Error('kss-node expected the builder to implement KssBuilderBase API version ' + kssBuilderAPI + '; version "' + builderAPI + '" is being used instead.'));
    }

    return Promise.resolve();
  }

  /**
   * Stores the given configuration settings.
   *
   * @param {Object} config An object of config settings to store.
   * @returns {KssBuilderBase} The `KssBuilderBase` object is returned to allow chaining
   *   of methods.
   */
  addConfig(config) {
    for (let key in config) {
      // istanbul ignore else
      if (config.hasOwnProperty(key)) {
        this.config[key] = config[key];
      }
    }

    // Allow clone to be used without a path. We can't specify this default
    // path in coreOptions or the clone flag would always be "on".
    if (config.clone === '' || config.clone === true) {
      this.config.clone = 'custom-builder';
    }

    // Allow chaining.
    return this.normalizeConfig(Object.keys(config));
  }

  /**
   * Returns the requested configuration setting or, if no key is specified, an
   * object containing all settings.
   *
   * @param {string} [key] Optional name of config setting to return.
   * @returns {*} The specified setting or an object of all settings.
   */
  getConfig(key) {
    return key ? this.config[key] : this.config;
  }

  /**
   * Adds configuration options to the builder.
   *
   * Since kss-node is extendable, builders can provide their own options for
   * configuration.
   *
   * Each option object is key-compatble with
   * [yargs](https://www.npmjs.com/package/yargs), the command-line utility
   * used by kss-node's command line tool.
   *
   * If an option object has a:
   * - `multiple` property: if set to `false`, the corresponding configuration
   *   will be normalized to a single value. Otherwise, it will be normalized to
   *   an array of values.
   * - `path` property: if set to `true`, the corresponding configuration will
   *   be normalized to a path, relative to the current working directory.
   * - `default` property: the corresponding configuration will default to this
   *   value.
   *
   * @param {object} options An object of configuration options.
   * @returns {KssBuilderBase} The `KssBuilderBase` object is returned to allow chaining
   *   of methods.
   */
  addOptions(options) {
    for (let key in options) {
      // istanbul ignore else
      if (options.hasOwnProperty(key)) {
        // The "multiple" property defaults to true.
        if (typeof options[key].multiple === 'undefined') {
          options[key].multiple = true;
        }
        // The "path" property defaults to false.
        if (typeof options[key].path === 'undefined') {
          options[key].path = false;
        }
        this.options[key] = options[key];
      }
    }

    // Allow chaining.
    return this.normalizeConfig(Object.keys(options));
  }

  /**
   * Returns the requested configuration option or, if no key is specified, an
   * object containing all options.
   *
   * @param {string} [key] Optional name of option to return.
   * @returns {*} The specified option or an object of all options.
   */
  getOptions(key) {
    return key ? this.options[key] : this.options;
  }

  /**
   * Normalizes the configuration so that it is easy to use inside KSS.
   *
   * The options specified with `addOptions()` determine how the configuration
   * will be normalized.
   *
   * @private
   * @param {string[]} keys The keys to normalize.
   * @returns {KssBuilderBase} The `KssBuilderBase` object is returned to allow chaining
   *   of methods.
   */
  normalizeConfig(keys) {
    for (let key of keys) {
      if (typeof this.options[key] !== 'undefined') {
        if (typeof this.config[key] === 'undefined') {
          // Set the default setting.
          if (typeof this.options[key].default !== 'undefined') {
            this.config[key] = this.options[key].default;
          }
        }
        // If an option is specified multiple times, yargs will convert it into an
        // array, but leave it as a string otherwise. This makes accessing the
        // values of options inconsistent, so make all other options an array.
        if (this.options[key].multiple) {
          if (!(this.config[key] instanceof Array)) {
            if (typeof this.config[key] === 'undefined') {
              this.config[key] = [];
            } else {
              this.config[key] = [this.config[key]];
            }
          }
        } else {
          // For options marked as "multiple: false", use the last value
          // specified, ignoring the others.
          if (this.config[key] instanceof Array) {
            this.config[key] = this.config[key].pop();
          }
        }
        // Resolve any paths relative to the working directory.
        if (this.options[key].path) {
          if (this.config[key] instanceof Array) {
            /* eslint-disable no-loop-func */
            this.config[key] = this.config[key].map(value => {
              return path.resolve(value);
            });
            /* eslint-enable no-loop-func */
          } else if (typeof this.config[key] === 'string') {
            this.config[key] = path.resolve(this.config[key]);
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
   * @returns {KssBuilderBase} The `KssBuilderBase` object is returned to allow chaining
   *   of methods.
   */
  log(message) {
    /* eslint-enable no-unused-vars */
    this.logFunction.apply(null, arguments);

    // Allow chaining.
    return this;
  }

  /**
   * The log() method logs a message for the user. This method allows the system
   * to define the underlying function used by the log method to report the
   * message to the user. The default log function is a wrapper around
   * `console.log()`.
   *
   * @param {Function} logFunction Function to log a message to the user.
   * @returns {KssBuilderBase} The `KssBuilderBase` object is returned to allow chaining
   *   of methods.
   */
  setLogFunction(logFunction) {
    this.logFunction = logFunction;

    // Allow chaining.
    return this;
  }

  /**
   * Clone a builder's files.
   *
   * This method is fairly simple; it copies one directory to the specified
   * location. An instance of KssBuilderBase does not need to override this method,
   * but it can if it needs to do something more complicated.
   *
   * @param {string} builderPath Path to the builder to clone.
   * @param {string} destinationPath Path to the destination of the newly cloned
   *   builder.
   * @returns {Promise} A `Promise` object resolving to `null`.
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
        let notHidden = new RegExp('^(?!.*' + path.sep + '(node_modules$|\\.))');
        return fs.copyAsync(
          builderPath,
          destinationPath,
          {
            clobber: true,
            filter: filePath => {
              // Only look at the part of the path inside the builder.
              let relativePath = path.sep + path.relative(builderPath, filePath);
              // Skip any files with a path matching: /node_modules or /.
              return notHidden.test(relativePath);
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
   * Initialize the style guide creation process.
   *
   * This method can be set by any KssBuilderBase sub-class to do any custom tasks
   * before the style guide is built.
   *
   * @returns {Promise} A `Promise` object resolving to `null`.
   */
  init() {
    return Promise.resolve();
  }

  /**
   * Allow the builder to prepare itself or modify the KssStyleGuide object.
   *
   * The method can be set by any KssBuilderBase sub-class to do any custom tasks
   * after the KssStyleGuide object is created and before the HTML style guide
   * is built.
   *
   * @param {KssStyleGuide} styleGuide The KSS style guide in object format.
   * @returns {Promise} A `Promise` object resolving to `styleGuide`.
   */
  prepare(styleGuide) {
    return Promise.resolve(styleGuide);
  }

  /**
   * Build the HTML files of the style guide given a KssStyleGuide object.
   *
   * @param {KssStyleGuide} styleGuide The KSS style guide in object format.
   * @returns {Promise} A `Promise` object resolving to `styleGuide`.
   */
  build(styleGuide) {
    return Promise.resolve(styleGuide);
  }
}

module.exports = KssBuilderBase;
