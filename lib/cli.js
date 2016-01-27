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

const fs = require('fs-extra'),
  kss = require('./kss'),
  path = require('path'),
  version = require('../package.json').version,
  yargs = require('yargs');

/**
 * Parses command line arguments in `opts.argv` and outputs messages and errors
 * on `opts.stdout` and `opts.stderr`, respectively.
 *
 * @param {Object} opts The `stdout`, `stderr` and `argv` options to use.
 * @param {Function} done Callback function.
 * @returns {*} The return value of kss().
 */
const cli = function(opts, done) {
  let stdout = opts.stdout,
    stderr = opts.stderr,
    // First 2 args are "node" and path to kss-node script; we don't need them.
    args = opts.argv.slice(2) || [];

  const kssConfig = new kss.KssConfig();

  // Add options only needed by the CLI or yargs.
  kssConfig.addOptions({
    // @TODO: Add stdin option.
    // 'stdin': {
    //   group: 'File locations:',
    //   multiple: false,
    //   boolean: true,
    //   describe: 'Reads the source from standard input',
    //  default: false
    // },
    'config': {
      group: 'File locations:',
      alias: 'c',
      config: true,
      multiple: false,
      describe: 'Load the kss-node configuration from a json file'
    },
    'demo': {
      multiple: false,
      boolean: true,
      describe: 'Builds a KSS demo.',
      default: false
    },
    // Prevent yargs from complaining about JSON comments in the config file.
    '//': {
      describe: 'JSON configurations will ignore comments.'
    }
  });

  // If the demo is requested, load the settings from its config file.
  if (args.indexOf('--demo') > 1) {
    // Add the configuration file to the raw arguments list.
    args.push('--config', path.join(__dirname, '../demo/kss-config.json'));
    stdout.write('WELCOME to the kss-node demo! We\'ve turned on the --verbose flag so you can see what kss-node is doing.' + '\n');
  }

  // We need to know which template to use, so we do a quick first parse of the
  // arguments using yargs.
  let settings = yargs(args).options(kssConfig.getOptions()).argv;

  // Check for settings coming from a config file.
  let configFile = {},
    configFileDir = '';
  if (settings.config) {
    let configPath = path.resolve(settings.config);
    configFile = require(configPath);
    configFileDir = path.dirname(configPath);
    if (configFile.template) {
      settings.template = path.resolve(configFileDir, configFile.template);
    }
  }

  // Load the options of template and of its generator.
  let template,
    generator;
  try {
    template = require(path.resolve(settings.template));
    generator = template.generator;
  } catch (e) {
    // Templates don't have to load their own generator. If the template fails
    // to load a generator, we assume it wanted the default generator.
    generator = require('../generator/handlebars');
  }
  if (generator.options) {
    kssConfig.addOptions(generator.options);
  }
  if (template && template.options) {
    kssConfig.addOptions(template.options);
  }

  // After the generator is loaded, we finally know all the options. So we
  // re-run yargs one last time with all the yarg options we need.
  settings = yargs(args)
    .options(kssConfig.getOptions())
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
    return done(null);
  }

  // All paths from the config file are relative to the file.
  for (let key in configFile) {
    if (configFile.hasOwnProperty(key) && kssConfig.getOptions()[key] && kssConfig.getOptions()[key].path) {
      if (settings[key] instanceof Array) {
        /* eslint-disable no-loop-func */
        settings[key] = settings[key].map(value => {
          return path.resolve(configFileDir, value);
        });
        /* eslint-enable no-loop-func */
      } else {
        settings[key] = path.resolve(configFileDir, settings[key]);
      }
    }
  }

  // Check for source and destination set as unnamed parameters.
  if (settings._.length > 0) {
    let positionalParams = settings._;
    // Check for a second unnamed parameter, the destination.
    if (positionalParams.length > 1) {
      settings.destination = positionalParams[1];
    }

    // The source directory is the first unnamed parameter.
    if (!(settings.source instanceof Array)) {
      settings.source = (typeof settings.source === 'undefined') ? [] : [settings.source];
    }
    settings.source.unshift(positionalParams[0]);
  }

  // If we are building the demo, copy the styles.css file to the destination.
  if (settings.demo) {
    fs.copy(path.resolve(__dirname, '../demo/styles.css'), path.resolve(settings.destination, 'styles.css'), {clobber: true}, function(error) {
      if (error) {
        // Show the full error stack if the verbose flag is used.
        if (settings.verbose) {
          stderr.write(error + '\n');
        } else {
          stderr.write('Error: ' + error.message + '\n');
        }
        return done(error);
      }
    });
  }

  // Clean up the settings by removing object properties that yargs adds, but
  // that we don't need for kss().
  ['config', '_', '//', 'help', 'h', '?', 'version', '$0'].forEach(key => delete settings[key]);
  let options = kssConfig.getOptions();
  for (let key in options) {
    if (options[key].alias) {
      delete settings[options[key].alias];
    }
  }
  for (let key in settings) {
    if (typeof settings[key] === 'undefined') {
      delete settings[key];
    }
  }

  // Pass on cli()'s stdout/stderr to kss().
  settings.pipes = {
    stdout: opts.stdout,
    stderr: opts.stderr
  };

  return kss(settings, done);
};

module.exports = cli;
