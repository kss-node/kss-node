'use strict';

/**
 * The `kss/lib/cli` module is a wrapper around the code used by the
 * `bin/kss-node` command line utility.
 *
 * ```
 * const cli = require('kss/lib/cli');
 * ```
 *
 * @module kss/lib/cli
 */

const Promise = require('bluebird'),
  kss = require('./kss'),
  KssBuilderBase = require('../builder'),
  path = require('path'),
  version = require('../package.json').version,
  yargs = require('yargs');

const fs = Promise.promisifyAll(require('fs-extra'));

/**
 * Parses command line arguments in `opts.argv` and outputs messages and errors
 * on `opts.stdout` and `opts.stderr`, respectively.
 *
 * @param {Object} opts The `stdout`, `stderr` and `argv` options to use.
 * @returns {Promise} A `Promise` object.
 */
const cli = function(opts) {
  let stdout = opts.stdout,
    stderr = opts.stderr,
    // First 2 args are "node" and path to kss-node script; we don't need them.
    args = opts.argv.slice(2) || /* istanbul ignore next */ [];

  const cliOptionDefinitions = {
    'config': {
      group: 'File locations:',
      alias: 'c',
      config: true,
      multiple: false,
      describe: 'Load the kss-node options from a json file'
    },
    'demo': {
      multiple: false,
      boolean: true,
      describe: 'Builds a KSS demo.',
      default: false
    },
    // Prevent yargs from complaining about JSON comments in the config file.
    '//': {
      describe: 'Comments in JSON files will be ignored'
    }
  };

  // If the demo is requested, load the settings from its config file.
  if (args.indexOf('--demo') !== -1) {
    // Add the configuration file to the raw arguments list.
    args.push('--config', path.join(__dirname, '../demo/kss-config.json'));
    stdout.write('WELCOME to the kss-node demo! We\'ve turned on the --verbose flag so you can see what kss-node is doing.' + '\n');
  }

  // We need to know which builder to use, so we do a quick first parse of the
  // arguments using yargs.
  let options = yargs(args).options(
    // We merge the CLI option definitions with the default KssBuilderBase
    // option definitions.
    (new KssBuilderBase()).addOptionDefinitions(cliOptionDefinitions).getOptionDefinitions()
  ).argv;

  // Check for settings coming from a JSON config file.
  let configFile = {},
    configFileDir = '';
  if (options.config) {
    let configPath = path.resolve(options.config);
    configFile = require(configPath);
    configFileDir = path.dirname(configPath);
    if (configFile.builder) {
      options.builder = path.resolve(configFileDir, configFile.builder);
    }
  }

  // Set up an error handler for Promised tasks in this module; kss() has its
  // own error handler.
  const cliError = function(error) {
    // Show the full error stack if the verbose option is used twice or more.
    if (options.verbose > 1) {
      stderr.write((error.stack ? error.stack : /* istanbul ignore next */ error) + '\n');
    } else {
      stderr.write('Error: ' + error.message + '\n');
    }
    return Promise.reject(error);
  };

  // Confirm this is a compatible builder.
  return KssBuilderBase.loadBuilder(options.builder).catch(cliError).then(builder => {
    builder.addOptionDefinitions(cliOptionDefinitions);

    // After the builder is loaded, we finally know all the option definitions.
    // So we re-run yargs one last time with all the yarg definitions we need.
    options = yargs(args)
      .options(builder.getOptionDefinitions())
      // Make a --help option available.
      .usage('Usage: kss-node [options]')
      .help('help')
      .alias('help', 'h')
      .alias('help', '?')
      .wrap(yargs.terminalWidth())
      // Make a --version option available.
      .version(version, 'version')
      // Complain if the user tries to configure a non-existent option.
      .strict()
      .argv;

    // If no arguments given, display help and exit.
    if (args.length === 0) {
      stdout.write(yargs.help() + '\n');
      return Promise.resolve();
    }

    // All paths from the config file are relative to the file.
    for (let key in configFile) {
      if (configFile.hasOwnProperty(key) && builder.getOptionDefinitions()[key] && builder.getOptionDefinitions()[key].path) {
        if (options[key] instanceof Array) {
          /* eslint-disable no-loop-func */
          options[key] = options[key].map(value => {
            return path.resolve(configFileDir, value);
          });
          /* eslint-enable no-loop-func */
        } else {
          options[key] = path.resolve(configFileDir, options[key]);
        }
      }
    }

    // Check for source and destination set as unnamed parameters.
    if (options._.length > 0) {
      let positionalParams = options._;
      // Check for a second unnamed parameter, the destination.
      if (positionalParams.length > 1) {
        options.destination = positionalParams[1];
      }

      // The source directory is the first unnamed parameter.
      if (!(options.source instanceof Array)) {
        options.source = (typeof options.source === 'undefined') ? [] : [options.source];
      }
      options.source.unshift(positionalParams[0]);
    }

    // If we are building the demo, copy the styles.css file to the destination.
    let demo = true;
    if (options.demo) {
      // We save the Promise for the end of this function.
      demo = fs.copyAsync(
        path.resolve(__dirname, '../demo/styles.css'),
        path.resolve(options.destination, 'styles.css'),
        {clobber: true}
      ).catch(cliError);
    }

    // Clean up the settings by removing object properties that yargs adds, but
    // that we don't need for kss().
    ['config', '_', '//', 'help', 'h', '?', 'version', '$0'].forEach(key => delete options[key]);
    let optionDefinitions = builder.getOptionDefinitions();
    for (let key in optionDefinitions) {
      if (optionDefinitions[key].alias) {
        delete options[optionDefinitions[key].alias];
      }
    }
    for (let key in options) {
      if (typeof options[key] === 'undefined') {
        delete options[key];
      }
    }

    // Pass on cli()'s stdout/stderr to kss().
    options.pipes = {
      stdout: opts.stdout,
      stderr: opts.stderr
    };

    return Promise.all([
      demo,
      kss(options)
    ]);
  });
};

module.exports = cli;
