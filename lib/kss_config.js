'use strict';

/**
 * The `kss/lib/kss_config` module is normally accessed via the
 * [`KssConfig()`]{@link module:kss.KssConfig} class of the `kss` module:
 * ```
 * const KssConfig = require('kss').KssConfig;
 * ```
 * @private
 * @module kss/lib/kss_config
 */

const path = require('path');

/**
 * The KssConfig class is a convenience class is used by the CLI and the kss()
 * function to:
 * - collect configuration settings
 * - collect options specified by templates and builders
 * - normalize the settings based on the options' configurations
 *
 * This class is normally accessed via the [`kss`]{@link module:kss} module:
 * ```
 * const KssConfig = require('kss').KssConfig;
 * ```
 *
 * A newly-created `KssConfig` object contains the default options used by the
 * [`kss()`]{@link module:kss.kss} function.
 *
 * @alias module:kss.KssConfig
 */
class KssConfig {

  /**
   * Creates a KssConfig object and stores the given configuration settings.
   *
   * @param {Object} [config] An object of config settings to store.
   */
  constructor(config) {
    this.config = {};
    this.options = {};

    if (config) {
      this.set(config);
    }
  }

  /**
   * Stores the given configuration settings.
   *
   * @param {Object} config An object of config settings to store.
   * @returns {KssConfig} The `KssConfig` object is returned to allow chaining
   *   of methods.
   */
  set(config) {
    for (let key in config) {
      // istanbul ignore else
      if (config.hasOwnProperty(key)) {
        this.config[key] = config[key];
      }
    }

    // Allow clone to be used without a path. We can't specify this default
    // path in coreOptions or the clone flag would always be "on".
    if (config.clone === '' || config.clone === true) {
      this.config.clone = 'custom-template';
    }

    // Allow chaining.
    return this.normalize(Object.keys(config));
  }

  /**
   * Returns the requested configuration setting or, if no key is specified, an
   * object containing all settings.
   *
   * @param {string} [key] Optional name of config setting to return.
   * @returns {*} The specified setting or an object of all settings.
   */
  get(key) {
    return key ? this.config[key] : this.config;
  }

  /**
   * Adds additional configuration options to the core kss-node options.
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
   * @returns {KssConfig} The `KssConfig` object is returned to allow chaining
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
    return this.normalize(Object.keys(options));
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
   * Normalizes the configuration object so that it is easy to use inside KSS.
   *
   * The options specified in the KssConfig object will determine how its
   * configuration will be normalized.
   *
   * @private
   * @param {string[]} keys The keys to normalize.
   * @returns {KssConfig} The `KssConfig` object is returned to allow chaining
   *   of methods.
   */
  normalize(keys) {
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
}

module.exports = KssConfig;
