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
 * @module kss
 */

const KssBuilderBase = require('../builder'),
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
    // If we fail to create a builder, set up builder.logError() for the
    // next .catch().
    builder = {
      logError: (typeof options.logErrorFunction === 'function') ? options.logErrorFunction : console.error
    };
    throw error;
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

    if (builder.getOptions('verbose')) {
      builder.log('...Parsing your style guide:');
    }

    // Then traverse the source and parse the files found.
    return traverse(builder.getOptions('source'), {
      header: true,
      markdown: true,
      markup: true,
      mask: builder.getOptions('mask'),
      custom: builder.getOptions('custom')
    }).then(styleGuide => {
      // Then allow the builder to prepare itself and the KssStyleGuide object.
      return builder.prepare(styleGuide);
    }).then(styleGuide => {
      // Then build the style guide.
      return builder.build(styleGuide);
    }).then(styleGuide => {
      if (builder.getOptions('verbose')) {
        builder.log('');
      }
      builder.log('Style guide build completed successfully!');
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
