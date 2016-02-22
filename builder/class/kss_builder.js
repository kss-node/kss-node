'use strict';

/**
 * The `kss/builder` module loads the {@link KssBuilder} class.
 * ```
 * const KssBuilder = require('kss/builder');
 * ```
 * @module kss/builder
 */

/* **************************************************************
   See kss_builder_example.js for how to implement a builder.
   ************************************************************** */

const path = require('path'),
  Promise = require('bluebird');

const fs = Promise.promisifyAll(require('fs-extra')),
  kssBuilderAPI = '3.0';

/**
 * A kss-node builder takes input files and builds a style guide.
 */
class KssBuilder {

  /**
   * Create a KssBuilder object.
   *
   * This is the base object used by all kss-node builders. Implementations of
   * KssBuilder MUST pass the version parameter. kss-node will use this to
   * ensure that only compatible builders are used.
   *
   * ```
   * const KssBuilder = require('kss/builder');
   * const customBuilder = new KssBuilder('3.0');
   * ```
   *
   * @param {string} version The builder API version implemented.
   * @param {object} options The Yargs-like options this builder has.
   *   See https://github.com/bcoe/yargs/blob/master/README.md#optionskey-opt
   */
  constructor(version, options) {
    // Store the version of the builder API that the builder instance is
    // expecting; we will verify this in checkBuilder().
    this.API = typeof version === 'undefined' ? 'undefined' : version;

    // Tell kss-node which Yargs-like options this builder has.
    this.options = options || {};

    // The log function defaults to console.log.
    this.setLogFunction(console.log);
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
   */
  log(message) {
    /* eslint-enable no-unused-vars */
    this.logFunction.apply(null, arguments);
  }

  /**
   * The log() method logs a message for the user. This method allows the system
   * to define the underlying function used by the log method to report the
   * message to the user. The default log function is a wrapper around
   * `console.log()`.
   *
   * @param {Function} logFunction Function to log a message to the user.
   */
  setLogFunction(logFunction) {
    this.logFunction = logFunction;
  }

  /**
   * Checks the builder configuration.
   *
   * An instance of KssBuilder MUST NOT override this method. A process
   * controlling the builder should call this method to verify the specified
   * builder has been configured correctly.
   *
   * @returns {Promise} A `Promise` object resolving to `null`.
   */
  checkBuilder() {
    let isCompatible = true,
      version,
      apiMajor,
      apiMinor,
      thisMajor,
      thisMinor;

    if (this.API === 'undefined') {
      isCompatible = false;
    } else {
      version = kssBuilderAPI.split('.');
      apiMajor = parseInt(version[0]);
      apiMinor = parseInt(version[1]);

      version = this.API.split('.');
      thisMajor = parseInt(version[0]);
      thisMinor = parseInt(version[1]);

      if (thisMajor !== apiMajor || thisMinor > apiMinor) {
        isCompatible = false;
      }
    }

    if (!isCompatible) {
      return Promise.reject(new Error('kss-node expected the template\'s builder to implement KssBuilder API version ' + kssBuilderAPI + '; version "' + this.API + '" is being used instead.'));
    }

    return Promise.resolve();
  }

  /**
   * Clone a template's files.
   *
   * This method is fairly simple; it copies one directory to the specified
   * location. An instance of KssBuilder does not need to override this method,
   * but it can if it needs to do something more complicated.
   *
   * @param {string} templatePath    Path to the template to clone.
   * @param {string} destinationPath Path to the destination of the newly cloned
   *                                 template.
   * @returns {Promise} A `Promise` object resolving to `null`.
   */
  clone(templatePath, destinationPath) {
    return fs.statAsync(destinationPath).catch(error => {
      // Pass the error on to the next .then().
      return error;
    }).then(result => {
      // If we successfully get stats, the destination exists.
      if (!(result instanceof Error)) {
        return Promise.reject(new Error('This folder already exists: ' + destinationPath));
      }

      // If the destination path does not exist, we copy the template to it.
      // istanbul ignore else
      if (result.code === 'ENOENT') {
        let notHidden = new RegExp('^(?!.*' + path.sep + '(node_modules$|\\.))');
        return fs.copyAsync(
          templatePath,
          destinationPath,
          {
            clobber: true,
            filter: filePath => {
              // Only look at the part of the path inside the template.
              let relativePath = path.sep + path.relative(templatePath, filePath);
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
   * This method is given a configuration JSON object with the details of the
   * requested style guide build. The builder can use this information for any
   * necessary tasks before the KSS parsing of the source files.
   *
   * @param {Object} config Configuration object for the requested build.
   * @returns {Promise} A `Promise` object resolving to `null`.
   */
  init(config) {
    // At the very least, builders MUST save the configuration parameters.
    this.config = config;

    return Promise.resolve();
  }

  /**
   * Allow the template to prepare itself or modify the KssStyleGuide object.
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

module.exports = KssBuilder;
