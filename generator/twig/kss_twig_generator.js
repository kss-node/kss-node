'use strict';

var KssGenerator = require('../kss_generator.js'),
  KssSection = require('../../lib/kss_section.js'),
  fs = require('fs'),
  glob = require('glob'),
  marked = require('marked'),
  path = require('path'),
  wrench = require('wrench'),
  mkdirp = require('mkdirp');

// Pass a string to KssGenerator() to tell the system which API version is
// implemented by kssTwigGenerator.
var kssTwigGenerator = new KssGenerator('2.0', {
  'helpers': {
    string: true,
    path: true,
    describe: 'Location of custom handlebars helpers; see http://bit.ly/kss-wiki'
  },
  'homepage': {
    string: true,
    multiple: false,
    describe: 'File name of the homepage\'s Markdown file',
    default: 'styleguide.md'
  },
  'placeholder': {
    string: true,
    multiple: false,
    describe: 'Placeholder text to use for modifier classes',
    default: '[modifier class]'
  }
});

/**
 * Initialize the style guide creation process.
 *
 * This method is given a configuration JSON object with the details of the
 * requested style guide generation. The generator can use this information for
 * any necessary tasks before the KSS parsing of the source files.
 *
 * @alias module:kss/generator/handlebars.init
 * @param {Object} config Configuration object for the style guide generation.
 */
kssTwigGenerator.init = function(config) {
  var i, j, helper;

  // Save the configuration parameters.
  this.config = config;

  if (this.config.verbose) {
    console.log('');
    console.log('Generating your KSS style guide!');
    console.log('');
    console.log(' * KSS Source  : ' + this.config.source.join(', '));
    console.log(' * Destination : ' + this.config.destination);
    console.log(' * Template    : ' + this.config.template);
    if (this.config.helpers.length) {
      console.log(' * Helpers     : ' + this.config.helpers.join(', '));
    }
    console.log('');
  }

  // Create a new destination directory.
  try {
    mkdirp.sync(this.config.destination);
  } catch (e) {
    // empty
  }

  // Optionally, copy the contents of the template's "public" folder.
  try {
    wrench.copyDirSyncRecursive(
      this.config.template + '/public',
      this.config.destination + '/public',
      {
        forceDelete: true,
        excludeHiddenUnix: true
      }
    );
  } catch (e) {
    // empty
  }

  // Ensure a "public" folder exists.
  try {
    mkdirp.sync(this.config.destination + '/public');
  } catch (e) {
    // empty
  }

  // Store the global Twig object.
  this.Twig = require('twig');

  // Load the standard Handlebars helpers.
  require('./helpers.js').register(this.Twig, this.config);

  // Compile the Handlebars template.
  this.template = fs.readFileSync(this.config.template + '/index.html', 'utf8');

  this.template = this.Twig.twig({
    data: this.template
  });

  console.log(this.template.render({baked_good: 'cupcake'}));
};

kssTwigGenerator.init({
  "//": "The source and destination paths are relative to this file.",
  "source": "demo",
  "css": [
    "public/styles.css"
  ],
  "js": [],
  "title": "kss-node Style Guide",
  "homepage": "homepage.md",
  "template": "generator/twig/template"
});
