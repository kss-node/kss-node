// Remove after https://github.com/Constellation/doctrine/issues/100 is fixed.
/*eslint-disable valid-jsdoc*/

'use strict';

/**
 * The `kss/generator/twigjs` module loads the kssTwigJSGenerator
 * object, a `{@link KssGenerator}` object using Twig.js templating.
 * ```
 * var kssTwigJSGenerator = require('kss/generator/twigjs');
 * ```
 * @module kss/generator/twigjs
 */
var KssGenerator = require('../kss_generator.js'),
  KssSection = require('../../lib/kss_section.js'),
  fs = require('fs'),
  glob = require('glob'),
  marked = require('marked'),
  path = require('path'),
  wrench = require('wrench');

// Pass a string to KssGenerator() that tells the generator which API version is
// implemented by kssTwigJSGenerator.
var kssTwigJSGenerator = new KssGenerator('2.0', {
  'helpers': {
    string: true,
    path: true,
    describe: 'Location of custom handlebars helpers; see http://bit.ly/kss-wiki'
  },
  'base': {
    string: true,
    path: true,
    multiple: false,
    describe: 'Base working directory for inline templates'
  },
  'homepage': {
    string: true,
    multiple: false,
    describe: 'File name of the homepage\'s Markdown file',
    default: 'styleguide.md'
  }
});

/**
 * Initialize the style guide creation process.
 *
 * This method is given a configuration JSON object with the details of the
 * requested style guide generation. The generator can use this information for
 * any necessary tasks before the KSS parsing of the source files.
 *
 * @alias module:kss/generator/twigjs.init
 * @param {Object} config Configuration object for the style guide generation.
 */
kssTwigJSGenerator.init = function(config) {
  var i, j, helper;

  // Save the configuration parameters.
  this.config = config;

  console.log('');
  console.log('Generating your KSS style guide!');
  console.log('');
  console.log(' * KSS Source  : ' + this.config.source.join(', '));
  console.log(' * Destination : ' + this.config.destination);
  console.log(' * Template    : ' + this.config.template);
  if (this.config.helpers) {
    console.log(' * Helpers     : ' + this.config.helpers.join(', '));
  }
  console.log('');

  // Create a new destination directory.
  try {
    fs.mkdirSync(this.config.destination);
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
    fs.mkdirSync(this.config.destination + '/public');
  } catch (e) {
    // empty
  }

  // Store the global TwigJS object.
  // @TODO: Switch to require('twig')
  this.TwigJS = require('twig/twig.js');
  this.twig = this.TwigJS.twig;

  // Load the standard TwigJS helpers.
  require('./helpers.js').register(this.TwigJS, this.config);

  // Load TwigJS helpers.
  if (this.config.helpers.length > 0) {
    for (i = 0; i < this.config.helpers.length; i++) {
      if (fs.existsSync(this.config.helpers[i])) {
        // Load custom TwigJS helpers.
        var helperFiles = fs.readdirSync(this.config.helpers[i]);

        for (j = 0; j < helperFiles.length; j++) {
          if (path.extname(helperFiles[j]) === '.js') {
            helper = require(this.config.helpers[i] + '/' + helperFiles[j]);
            if (typeof helper.register === 'function') {
              helper.register(this.TwigJS, this.config);
            }
          }
        }
      }
    }
  }

  // Compile the TwigJS template.
  this.template = fs.readFileSync(this.config.template + '/index.html', 'utf8');
  this.template = this.twig({data: this.template});
};

/**
 * Generate the HTML files of the style guide given a KssStyleguide object.
 *
 * @alias module:kss/generator/twigjs.generate
 * @param {KssStyleguide} styleguide The KSS style guide in object format.
 */
kssTwigJSGenerator.generate = function(styleguide) {
  var sections = styleguide.section(),
    sectionCount = sections.length,
    sectionRoots = [],
    rootCount,
    currentRoot,
    childSections = [],
    partials = {},
    partial,
    files = [],
    i,
    key;

  console.log(styleguide.data.files.map(function(file) {
    return ' - ' + file;
  }).join('\n'));

  // Throw an error if no KSS sections are found in the source files.
  if (sectionCount === 0) {
    throw new Error('No KSS documentation discovered in source files.');
  }

  console.log('...Determining section markup:');

  for (i = 0; i < sectionCount; i += 1) {
    // Register all the markup blocks as TwigJS partials.
    if (sections[i].markup()) {
      partial = {
        name: sections[i].reference(),
        reference: sections[i].reference(),
        file: '',
        markup: sections[i].markup(),
        data: {}
      };
      // If the markup is a file path, attempt to load the file.
      if (partial.markup.match(/^[^\n]+\.(html|twig)$/)) {
        partial.file = partial.markup;
        partial.name = path.basename(partial.file, path.extname(partial.file));
        files = [];
        for (key in this.config.source) {
          if (!files.length) {
            files = glob.sync(this.config.source[key] + '/**/' + partial.file);
          }
        }
        // If the markup file is not found, note that in the style guide.
        if (!files.length) {
          partial.markup += ' NOT FOUND!';
        }
        console.log(' - ' + partial.reference + ': ' + partial.markup);
        if (files.length) {
          // Load the partial's markup from file.
          partial.file = files[0];
          partial.markup = fs.readFileSync(partial.file, 'utf8');
          // Load sample data for the partial from the sample .json file.
          if (fs.existsSync(path.dirname(partial.file) + '/' + partial.name + '.json')) {
            try {
              partial.data = require(path.dirname(partial.file) + '/' + partial.name + '.json');
            } catch (e) {
              partial.data = {};
            }
          }
        }
      } else {
        console.log(' - ' + partial.reference + ': inline markup');
      }
      // Register the partial using the filename (without extension) or using
      // the style guide reference.
      // Save the name of the partial and its data for retrieval in the markup
      // helper, where we only know the reference.
      // @TODO Fix this properly. Don't just skip ahead.
      try {
        partials[partial.reference] = this.twig({
          id: 'template-' + partial.name,
          data: partial.markup,
          variables: partial.data
        });
      } catch (err) {
        console.log('Couldn\'t create template. Duplicate template ID ' + partial.name + '. What to do?');
      }
    }

    // Accumulate all of the sections' first indexes
    // in case they don't have a root element.
    currentRoot = sections[i].reference().split(/(?:\.|\ \-\ )/)[0];
    var found = false;
    for (var j in sectionRoots) {
      if (sectionRoots[j].reference === currentRoot) {
        found = true;
        break;
      }
    }
    if (!found && sections[i]) {
      sectionRoots.push({'reference': sections[i].reference(), 'header': sections[i].header(), 'referenceURI': sections[i].referenceURI()});
    }
  }

  console.log('...Generating style guide sections:');

  // Now, group all of the sections by their root
  // reference, and make a page for each.
  rootCount = sectionRoots.length;
  for (i = 0; i < rootCount; i += 1) {
    childSections = styleguide.section(sectionRoots[i].reference + '.*');

    this.generatePage(styleguide, childSections, sectionRoots[i].reference, sectionRoots, partials);
  }

  // Generate the homepage.
  childSections = [];
  this.generatePage(styleguide, childSections, 'styleguide.homepage', sectionRoots, partials);
};

/**
 * Renders the TwigJS template for a section and saves it to a file.
 *
 * @alias module:kss/generator/twigjs.generatePage
 * @param {KssStyleguide} styleguide The KSS style guide in object format.
 * @param {Array} sections An array of KssSection objects.
 * @param {string} root The current section's reference.
 * @param {Array} sectionRoots An array of section references for all sections at the root of the style guide.
 * @param {Object} partials A hash of the names and data of the registered Handlebars partials.
 */
kssTwigJSGenerator.generatePage = function(styleguide, sections, root, sectionRoots, partials) {
  var filename = '', files,
    homepageText = false,
    styles = '',
    scripts = '',
    customFields = this.config.custom,
    key;

  if (root === 'styleguide.homepage') {
    filename = 'index.html';
    console.log(' - homepage');
    // Ensure homepageText is a non-false value.
    for (key in this.config.source) {
      if (!homepageText) {
        try {
          files = glob.sync(this.config.source[key] + '/**/' + this.config.homepage);
          if (files.length) {
            homepageText = ' ' + marked(fs.readFileSync(files[0], 'utf8'));
          }
        } catch (e) {
          // empty
        }
      }
    }
    if (!homepageText) {
      homepageText = ' ';
      console.log('   ...no homepage content found in ' + this.config.homepage + '.');
    }
  } else {
    filename = 'section-' + KssSection.prototype.encodeReferenceURI(root) + '.html';
    console.log(
      ' - section ' + root + ' [',
      styleguide.section(root) ? styleguide.section(root).header() : 'Unnamed',
      ']'
    );
  }
  // Create the HTML to load the optional CSS and JS.
  /*eslint-disable guard-for-in*/
  for (key in this.config.css) {
    styles = styles + '<link rel="stylesheet" href="' + this.config.css[key] + '">\n';
  }
  for (key in this.config.js) {
    scripts = scripts + '<script src="' + this.config.js[key] + '"></script>\n';
  }
  /*eslint-enable guard-for-in*/

  /*eslint-disable key-spacing*/
  fs.writeFileSync(this.config.destination + '/' + filename,
    this.template.render({
      partials:     partials,
      styleguide:   styleguide,
      sectionRoots: sectionRoots,
      sections:     sections.map(function(section) {
        if (typeof section.markup !== 'string') {
          // Flatten markup into a string.
          section.markup = section.markup();
        }
        return section.toJSON(customFields);
      }),
      rootName:     root,
      options:      this.config || {},
      homepage:     homepageText,
      styles:       styles,
      scripts:      scripts
    })
  );
  /*eslint-enable key-spacing*/
};

module.exports = kssTwigJSGenerator;
