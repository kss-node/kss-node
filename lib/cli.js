'use strict';

// var Promise = require('bluebird'),
var fs = require('fs-extra'),
  KssConfig = require('./kss_config.js'),
  path = require('path'),
  version = require('../package.json').version,
  yargs = require('yargs');

var cli;

cli = function(opts, done) {
  var generator,
    kssConfig = new KssConfig(),
    logError,
    positionalParams,
    stdout,
    stderr,
    argv;

  stdout = opts.stdout;
  stderr = opts.stderr;
  argv = opts.argv || [];

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
    'xdemo': {
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

  // The interaction between Yargs and KssConfig is persnickety, so we extend
  // both objects to add convenience methods to handle the details.
  yargs.parseKssOptions = function() {
    // First 2 args are "node" and path to kss-node script; we don't need them.
    return yargs(argv.slice(2))
      // Yargs needs the options that kssConfig has collected.
      .options(kssConfig.options);
  };
  kssConfig.setFromYargs = function() {
    this.set(yargs.parseKssOptions().argv);
  };

  // Get the config passed from CLI's argv.
  kssConfig.setFromYargs();

  // If the demo is requested, load the settings from its config file.
  if (kssConfig.get('xdemo')) {
    // Add the configuration file to the raw arguments list; otherwise, Yargs
    // won't read the config from the JSON file.
    argv.push('--config', path.join(__dirname, '../demo/kss-config.json'));
    kssConfig.setFromYargs();
    stdout.write('WELCOME to the kss-node demo! We\'ve turned on the --verbose flag so you can see what kss-node is doing.' + '\n');

  } else {
    // Check if there are unnamed parameters.
    positionalParams = kssConfig.get('_');
    if (positionalParams.length > 0) {
      // Check if the destination is the second unnamed parameter.
      if (positionalParams.length > 1) {
        argv.push('--destination', positionalParams[1]);
      }

      // The source directory is the first unnamed parameter.
      argv.push('--source', positionalParams[0]);

      kssConfig.setFromYargs();
    }
  }

  // Based on the template location specified in the kssConfig, load the
  // requested template's generator.
  generator = kssConfig.loadGenerator();

  // Set the logging function of the generator.
  generator.setLogFunction(function() {
    var message = '';
    for (var i = 0; i < arguments.length; i++) {
      message += arguments[i];
    }
    stdout.write(message + '\n');
  });

  // Set up an error handling function.
  logError = function(error) {
    // Show the full error stack if the verbose flag is used.
    if (kssConfig.get('verbose')) {
      stderr.write(error + '\n');
    } else {
      stderr.write('Error: ' + error.message + '\n');
    }
    return done(error);
  };

  // After the generator is loaded, kssConfig finally knows all the options, so
  // we tell yargs to ensure strictness (i.e. complain if the user tries to
  // configure a non-existant option.
  kssConfig.set(yargs
    .parseKssOptions()
    // And make a help option available.
    .usage('Usage: kss-node [options]')
    .help('help')
      .alias('help', 'h')
      .alias('help', '?')
    .version(version, 'version')
    .strict()
    .wrap(yargs.terminalWidth())
    .argv
  );

  // If no settings given, display help and exit.
  if (argv.slice(2).length === 0) {
    generator.log(yargs.help());
    return done(null);
  }

  // Clean up paths and massage settings to expected types.
  kssConfig.normalize();

  // If we are building the demo, copy the styles.css file to the destination.
  if (kssConfig.get('xdemo')) {
    fs.copy(path.resolve(__dirname, '../demo/styles.css'), path.resolve(kssConfig.get('destination'), 'styles.css'), {clobber: true}, function(error) {
      if (error) {
        return logError(error);
      }
    });
  }

  // If requested, clone a template and exit.
  if (kssConfig.get('clone')) {
    generator.log('Creating a new style guide template...');

    generator.clone(kssConfig.get('template'), kssConfig.get('clone'), function(error) {
      if (error) {
        return logError(error);
      }

      generator.log('You can change it as you like, and use it with your style guide like so:');
      generator.log('kss-node [sourcedir] --template ' + kssConfig.get('clone'));

      // We're done early!
      return done(null);
    });

    // generator.clone() is async and we don't want cli() to continue.
    return;
  }

  // If no source is specified, display help and exit.
  if (!kssConfig.get('source').length) {
    return logError(new Error('No --source specified. Use --help for instructions on proper usage.'));
  }

  // Initialize the generator.
  /* eslint-disable max-nested-callbacks */
  generator.init(kssConfig.config, function(error) {
    if (error) {
      return logError(error);
    }

    // Then traverse the source and parse the files found.
    generator.parse(function(error, styleguide) {
      if (error) {
        return logError(error);
      }

      // Then allow the template to prepare itself and the KssStyleguide object.
      generator.prepare(styleguide, function(error, styleguide) {
        if (error) {
          return logError(error);
        }

        // Then generate the style guide.
        generator.generate(styleguide, function(error) {
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
};

module.exports = cli;
