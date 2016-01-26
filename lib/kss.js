/* eslint-disable key-spacing */

'use strict';

/**
 * The core kss API can be imported with:
 * ```
 * var kss = require('kss');
 * ```
 *
 * The main object is a function that will generate a style guide given the
 * correct options.
 * ```
 * kss(options, callback);
 * ```
 * The various constructors and methods can then be accessed with:
 * ```
 * const KssStyleGuide = require('kss').KssStyleGuide;
 * const KssSection    = require('kss').KssSection;
 * const KssModifier   = require('kss').KssModifier;
 * const KssParameter  = require('kss').KssParameter;
 * const KssConfig     = require('kss').KssConfig;
 *
 * const kss           = require('kss');
 * const traverse      = require('kss').traverse();
 * const parse         = require('kss').parse();
 * ```
 * @module kss
 */

const KssConfig = require('./kss_config.js'),
  traverse = require('./traverse.js');

/**
 * Generates a style guide given the proper options.
 *
 * @param {object} [options] A collection of configuration options.
 * @param {Function} done Callback function
 */
const kss = function(options, done) {
  if (typeof options === 'function') {
    done = options;
    options = {};
  }
  options = options || {};
  options.pipes = options.pipes || {};
  options.pipes.stdout = options.pipes.stdout || process.stdout;
  options.pipes.stderr = options.pipes.stderr || process.stderr;
  done = done || function() {};

  const kssConfig = new KssConfig(options);

  // Set up an error handling function.
  const logError = function(error) {
    // Show the full error stack if the verbose flag is used.
    if (kssConfig.get('verbose')) {
      options.pipes.stderr.write(error + '\n');
    } else {
      options.pipes.stderr.write('Error: ' + error.message + '\n');
    }
    return done(error);
  };

  // Based on the template location specified in the kssConfig, load the
  // requested template's generator.
  kssConfig.loadGenerator(function(error, generator) {
    if (error) {
      return logError(error);
    }

    // Set the logging function of the generator.
    generator.setLogFunction(function() {
      let message = '';
      for (let i = 0; i < arguments.length; i++) {
        message += arguments[i];
      }
      options.pipes.stdout.write(message + '\n');
    });

    // If requested, clone a template and exit.
    if (kssConfig.get('clone')) {
      generator.log('Creating a new style guide template in ' + kssConfig.get('clone') + '...');

      generator.clone(kssConfig.get('template'), kssConfig.get('clone'), function(error) {
        if (error) {
          return logError(error);
        }

        generator.log('You can change it as you like, and use it to generate your style guide using the "template" option');

        // We're done early!
        return done(null);
      });

      // generator.clone() is async and we don't want kss() to continue.
      return;
    }

    // If no source is specified, display helpful error and exit.
    if (!kssConfig.get('source').length) {
      return logError(new Error('No "source" option specified.'));
    }

    // Initialize the generator.
    /* eslint-disable max-nested-callbacks */
    generator.init(kssConfig.get(), function(error) {
      if (error) {
        return logError(error);
      }

      if (kssConfig.get('verbose')) {
        generator.log('...Parsing your style guide:');
      }

      // Then traverse the source and parse the files found.
      traverse(kssConfig.get('source'), {
        header: true,
        markdown: true,
        markup: true,
        mask: kssConfig.get('mask'),
        custom: kssConfig.get('custom')
      }, function(error, styleGuide) {
        if (error) {
          return logError(error);
        }

        // Then allow the template to prepare itself and the KssStyleGuide object.
        generator.prepare(styleGuide, function(error, styleGuide) {
          if (error) {
            return logError(error);
          }

          // Then generate the style guide.
          generator.generate(styleGuide, function(error) {
            if (error) {
              return logError(error);
            }
            if (kssConfig.get('verbose')) {
              generator.log('');
            }
            generator.log('Style guide generation completed successfully!');

            return done(null);
          });
        });
      });
    });
  });
};

module.exports = kss;
module.exports.KssConfig = KssConfig;
module.exports.KssStyleGuide = require('./kss_styleguide.js');
module.exports.KssSection = require('./kss_section.js');
module.exports.KssModifier = require('./kss_modifier.js');
module.exports.KssParameter = require('./kss_parameter.js');
module.exports.parse = require('./parse.js');
module.exports.traverse = traverse;
