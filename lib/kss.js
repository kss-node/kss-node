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
 * kss(opts, callback);
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

const cli = require('./cli.js');

/**
 * Generates a style guide given the proper options.
 *
 * @param {object} [options] A collection of configuration options.
 * @param {Function} done Callback function
 * @returns {*} null
 */
const kss = function(options, done) {
  if (typeof options === 'function') {
    done = options;
    options = {};
  }
  options = options || {};
  options.pipes = options.pipes || {};
  done = done || function() {};

  // Allow options to provide an alternative to the process' stdout/stderr.
  let stdout = options.pipes.stdout ? options.pipes.stdout : process.stdout;
  let stderr = options.pipes.stderr ? options.pipes.stderr : process.stderr;

  // Create an argv-like Array from the options.
  let argv = ['node', 'bin/kss-node'];
  for (let flag in options) {
    if (options.hasOwnProperty(flag)) {
      let values = options[flag];
      if (!Array.isArray(values)) {
        values = [values];
      }
      for (let i = 0; i < values.length; i++) {
        if (values[i] === null
          || typeof values[i] === 'boolean'
          || typeof values[i] === 'undefined'
        ) {
          argv.push('--' + flag);
        } else {
          argv.push('--' + flag, values[i]);
        }
      }
    }
  }

  // @TODO: This is a bit backwards, but our CLI came first. So now our "pure"
  // JavaScript API is calling the cli module. In 3.x, swap this around.
  return cli({
    stdout: stdout,
    stderr: stderr,
    argv: argv
  }, done);
};

module.exports = kss;
module.exports.KssConfig = require('./kss_config.js');
module.exports.KssStyleGuide = require('./kss_styleguide.js');
module.exports.KssSection = require('./kss_section.js');
module.exports.KssModifier = require('./kss_modifier.js');
module.exports.KssParameter = require('./kss_parameter.js');
module.exports.parse = require('./parse.js');
module.exports.traverse = require('./traverse.js');
