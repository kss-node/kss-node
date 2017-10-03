'use strict';

/**
 * The core kss API can be imported with:
 * ```
 * var kss = require('kss');
 * ```
 *
 * The main object is a function that will build a style guide given the correct
 * options.
 * ```
 * kss(options);
 * ```
 * The various constructors and methods can then be accessed with:
 * ```
 * const KssStyleGuide = require('kss').KssStyleGuide;
 * const KssSection    = require('kss').KssSection;
 * const KssModifier   = require('kss').KssModifier;
 * const KssParameter  = require('kss').KssParameter;
 *
 * const kss           = require('kss');
 * const traverse      = require('kss').traverse();
 * const parse         = require('kss').parse();
 * ```
 *
 * The usual style guide build process:
 * - The command-line tool uses `lib/cli` to gather the command line options,
 *   which passes the options to `kss()`.
 * - The `kss()` function takes an object of options and calls `traverse()`.
 * - The `traverse()` function reads all the `source` directories and calls
 *   `parse()`.
 * - The `parse()` function finds the KSS comments in the provided text, creates
 *   a JSON object containing all the parsed data and passes it the
 *   `new KssStyleGuide(data)` constructor to create a style guide object.
 * - The `kss()` function loads the specified builder, which is a collection of
 *   files and an optional module that provides a sub-class of `KssBuilderBase`.
 * - `kss()` passes its options to the builder the builder's `addOptions()`
 *   method.
 * - The builder's `prepare()` method is given the `KssStyleGuide` object and
 *   can do any pre-build tasks, like initializing its templating system (if it
 *   has one.)
 * - The builder's `build()` method is run and the style guide files are
 *   created in the specified destination.
 * @module kss
 */

const KssBuilderBase = require('../builder/base'),
  KssStyleGuide = require('./kss_style_guide.js'),
  path = require('path'),
  Promise = require('bluebird'),
  traverse = require('./traverse.js');

/**
 * Builds a style guide given the proper options.
 *
 * @param {object} [options] A collection of options.
 * @returns {Promise.<KssStyleGuide|null>} A `Promise` object resolving to a
 *   `KssStyleGuide` object, or to `null` if the clone option is used.
 */
const kss = function(options) {
  options = options || {};

  let builder;

  // Confirm this is a compatible builder.
  return KssBuilderBase.loadBuilder(options.builder || require('../builder/handlebars')).catch(error => {
    let catchLoadFailure;
    const supportedBuilders = [
      'builder/twig',
      'builder/nunjucks'
    ];
    // If the builder was specified and there was no existing
    // path relative to the working directory, we should try again while using
    // the path to kss-node's builder.
    // istanbul ignore if
    if (supportedBuilders.indexOf(options.builder) > -1) {
      options.builder = path.resolve(__dirname, '..', options.builder);
      catchLoadFailure = KssBuilderBase.loadBuilder(options.builder);
    } else {
      catchLoadFailure = Promise.reject(error);
    }

    return catchLoadFailure.catch(error => {
      // If we fail to create a builder, set up builder.logError() for the
      // next .catch().
      builder = {
        logError: (typeof options.logErrorFunction === 'function') ? options.logErrorFunction : console.error
      };
      throw error;
    });
  }).then(newBuilder => {
    builder = newBuilder;

    // Add the options to the builder.
    builder.addOptions(options);

    // If requested, clone a builder and exit.
    if (builder.getOptions('clone')) {
      builder.log('Creating a new style guide builder in ' + builder.getOptions('clone') + '...');

      return builder.clone(builder.getOptions('builder'), builder.getOptions('clone')).then(() => {
        builder.log('You can change it as you like, and use it to build your style guide using the "builder" option');
        return Promise.resolve();
      });
    }

    // If no source is specified, display helpful error and exit.
    if (!builder.getOptions('source').length) {
      return Promise.reject(new Error('No "source" option specified.'));
    }

    let parseTask;

    // Check the 'source' array for paths ending in .json and convert the first
    // one into a KssStyleGuide object.
    let jsonInput = builder.getOptions('source').find(filePath => {
      return (path.extname(filePath) === '.json');
    });

    if (jsonInput) {
      try {
        let styleGuide = require(jsonInput);
        parseTask = Promise.resolve(new KssStyleGuide(styleGuide));
      } catch (error) {
        parseTask = Promise.reject(new Error('Failed to open JSON file: ' + jsonInput));
      }
    }

    // Then traverse the source and parse the files found.
    if (!parseTask) {
      if (builder.getOptions('verbose')) {
        builder.log('...Parsing your style guide:');
      }

      parseTask = traverse(builder.getOptions('source'), {
        header: true,
        markdown: true,
        markup: true,
        mask: builder.getOptions('mask'),
        custom: builder.getOptions('custom'),
        emoji: builder.getOptions('emoji')
      });
    }

    if (builder.getOptions('json')) {
      return parseTask.then(styleGuide => {
        return styleGuide.toJSON();
      });
    }

    return parseTask.then(styleGuide => {
      // Then allow the builder to prepare itself and the KssStyleGuide object.
      return builder.prepare(styleGuide);
    }).then(styleGuide => {
      // Then build the style guide.
      return builder.build(styleGuide);
    }).then(styleGuide => {
      if (builder.getOptions('verbose')) {
        builder.log('Style guide build completed successfully!');
      }
      return Promise.resolve(styleGuide);
    });
  }).catch(error => {
    builder.logError(error);
    throw error;
  });
};

module.exports = kss;
module.exports.KssStyleGuide = require('./kss_style_guide.js');
module.exports.KssSection = require('./kss_section.js');
module.exports.KssModifier = require('./kss_modifier.js');
module.exports.KssParameter = require('./kss_parameter.js');
module.exports.parse = require('./parse.js');
module.exports.traverse = traverse;
