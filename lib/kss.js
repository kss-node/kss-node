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
 * kss(options, callback);
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

const KssBuilder = require('../builder'),
  path = require('path'),
  Promise = require('bluebird'),
  traverse = require('./traverse.js');

/**
 * Builds a style guide given the proper options.
 *
 * @param {object} [options] A collection of configuration options.
 * @returns {Promise} A `Promise` object.
 */
const kss = function(options) {
  options = options || {};
  options.pipes = options.pipes || {};
  options.pipes.stdout = options.pipes.stdout || process.stdout;
  options.pipes.stderr = options.pipes.stderr || process.stderr;

  // Based on the builder location specified in the options, load the
  // requested builder.
  let builder;
  try {
    if (!options.builder) {
      throw new Error();
    }
    builder = require(path.resolve(options.builder));
  } catch (error) {
    // Builders don't have to export their own builder objects. If the builder
    // fails to export a builder object, we assume it wanted the default
    // builder.
    builder = require('../builder/handlebars');
  }

  // Confirm this is a compatible builder.
  return KssBuilder.checkBuilder(builder).then(() => {
    // Add the configuration options to the builder.
    builder.addConfig(options);

    // Set the logging function of the builder.
    builder.setLogFunction(function() {
      let message = '';
      for (let i = 0; i < arguments.length; i++) {
        message += arguments[i];
      }
      options.pipes.stdout.write(message + '\n');
    });

    // If requested, clone a builder and exit.
    if (builder.getConfig('clone')) {
      builder.log('Creating a new style guide builder in ' + builder.getConfig('clone') + '...');

      return builder.clone(builder.getConfig('builder'), builder.getConfig('clone')).then(() => {
        builder.log('You can change it as you like, and use it to build your style guide using the "builder" option');
        return Promise.resolve();
      });
    }

    // If no source is specified, display helpful error and exit.
    if (!builder.getConfig('source').length) {
      return Promise.reject(new Error('No "source" option specified.'));
    }

    // Initialize the builder.
    return builder.init().then(() => {
      if (builder.getConfig('verbose')) {
        builder.log('...Parsing your style guide:');
      }

      // Then traverse the source and parse the files found.
      return traverse(builder.getConfig('source'), {
        header: true,
        markdown: true,
        markup: true,
        mask: builder.getConfig('mask'),
        custom: builder.getConfig('custom')
      });
    }).then(styleGuide => {
      // Then allow the builder to prepare itself and the KssStyleGuide object.
      return builder.prepare(styleGuide);
    }).then(styleGuide => {
      // Then build the style guide.
      return builder.build(styleGuide);
    }).then(() => {
      if (builder.getConfig('verbose')) {
        builder.log('');
      }
      builder.log('Style guide build completed successfully!');
      return Promise.resolve();
    });
  }).catch(error => {
    // Show the full error stack if the verbose flag is used.
    if (builder && builder.getConfig && builder.getConfig('verbose')) {
      options.pipes.stderr.write(error + '\n');
    } else {
      options.pipes.stderr.write('Error: ' + error.message + '\n');
    }
    throw error;
  });
};

module.exports = kss;
module.exports.KssStyleGuide = require('./kss_styleguide.js');
module.exports.KssSection = require('./kss_section.js');
module.exports.KssModifier = require('./kss_modifier.js');
module.exports.KssParameter = require('./kss_parameter.js');
module.exports.parse = require('./parse.js');
module.exports.traverse = traverse;
