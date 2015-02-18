var KssHandlebarsGenerator,
  KssGenerator = require('../kss_generator.js'),
  fs = require('fs'),
  path = require('path'),
  wrench = require('wrench');

module.exports = KssHandlebarsGenerator = new KssGenerator();

/**
 * Initialize the style guide creation process.
 *
 * This method is given a KssGeneratorConfig object with the details of the
 * requested style guide generation. The generator can use this information for
 * any necessary tasks before the KSS parsing of the source files.
 *
 * @param {KssGeneratorConfig} config Configuration object for the style guide generation.
 */
KssHandlebarsGenerator.init = function(config) {
  var i, helper;

  // Save the configuration parameters.
  this.config = config;

  console.log('');
  console.log('Generating your KSS style guide!');
  console.log('');
  console.log(' * KSS Source  : ' + this.config.source.join(', '));
  console.log(' * Destination : ' + this.config.destination);
  console.log(' * Template    : ' + this.config.template);
  console.log(' * Helpers     : ' + this.config.helpers);
  console.log('');

  // Create a new destination directory.
  try {
    fs.mkdirSync(this.config.destination);
  } catch (e) {}

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
  } catch (e) {}

  // Ensure a "public" folder exists.
  try {
    fs.mkdirSync(this.config.destination + '/public');
  } catch (e) {}

  // Store the global Handlebars object.
  this.Handlebars = require('handlebars');

  // Load Handlebars helpers.
  if (fs.existsSync(this.config.helpers)) {
    // Load custom Handlebars helpers.
    var helperFiles = fs.readdirSync(this.config.helpers);

    for (i = 0; i < helperFiles.length; i++) {
      if (path.extname(helperFiles[i]) !== '.js') {
        return;
      }
      helper = require(this.config.helpers + '/' + helperFiles[i]);
      if (typeof helper.register === 'function') {
        helper.register(this.Handlebars);
      }
    }
  }

  // Load the standard Handlebars helpers.
  require('./helpers.js').register(this.Handlebars);

  // Compile the Handlebars template.
  this.template = fs.readFileSync(this.config.template + '/index.html', 'utf8');
  this.template = this.Handlebars.compile(this.template);
}
