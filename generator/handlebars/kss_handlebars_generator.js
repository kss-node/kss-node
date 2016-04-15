// Remove after https://github.com/Constellation/doctrine/issues/100 is fixed.
/* eslint-disable valid-jsdoc */

'use strict';

/**
 * The `kss/generator/handlebars` module loads the kssHandlebarsGenerator
 * object, a `{@link KssGenerator}` object using Handlebars templating.
 * ```
 * var kssHandlebarsGenerator = require('kss/generator/handlebars');
 * ```
 * @module kss/generator/handlebars
 */

var KssGenerator = require('../kss_generator.js'),
  KssSection = require('../../lib/kss_section.js'),
  fs = require('fs'),
  glob = require('glob'),
  marked = require('marked'),
  path = require('path'),
  wrench = require('wrench'),
  mkdirp = require('mkdirp');

// Pass a string to KssGenerator() to tell the system which API version is
// implemented by kssHandlebarsGenerator.
var kssHandlebarsGenerator = new KssGenerator('2.1', {
  'helpers': {
    group: 'Style guide:',
    string: true,
    path: true,
    describe: 'Location of custom handlebars helpers; see http://bit.ly/kss-wiki'
  },
  'homepage': {
    group: 'Style guide:',
    string: true,
    multiple: false,
    describe: 'File name of the homepage\'s Markdown file',
    default: 'styleguide.md'
  },
  'placeholder': {
    group: 'Style guide:',
    string: true,
    multiple: false,
    describe: 'Placeholder text to use for modifier classes',
    default: '[modifier class]'
  },
  'nav-depth': {
    group: 'Style guide:',
    multiple: false,
    describe: 'Limit the navigation to the depth specified',
    default: 3
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
 * @param {Object} config Configuration object for the requested generation.
 * @param {Function} cb Callback that will be given an Error as its first
 *                      parameter, if one occurs.
 * @returns {*} The callback's return value.
 */
kssHandlebarsGenerator.init = function(config, cb) {
  var i, j, helper;

  cb = cb || /* istanbul ignore next */ function() {};

  // Save the configuration parameters.
  this.config = config;
  this.config.helpers = this.config.helpers || [];

  // Store the global Handlebars object.
  this.Handlebars = require('handlebars');

  // Load the standard Handlebars helpers.
  require('./helpers.js').register(this.Handlebars, this.config);

  if (this.config.verbose) {
    this.log('');
    this.log('Generating your KSS style guide!');
    this.log('');
    this.log(' * KSS Source  : ' + this.config.source.join(', '));
    this.log(' * Destination : ' + this.config.destination);
    this.log(' * Template    : ' + this.config.template);
    if (this.config.helpers.length) {
      this.log(' * Helpers     : ' + this.config.helpers.join(', '));
    }
    this.log('');
  }

  // Create a new destination directory.
  try {
    mkdirp.sync(this.config.destination + '/public');
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

  // Load Handlebars helpers.
  if (this.config.helpers.length > 0) {
    for (i = 0; i < this.config.helpers.length; i++) {
      if (fs.existsSync(this.config.helpers[i])) {
        // Load custom Handlebars helpers.
        var helperFiles = fs.readdirSync(this.config.helpers[i]);

        for (j = 0; j < helperFiles.length; j++) {
          if (path.extname(helperFiles[j]) === '.js') {
            helper = require(this.config.helpers[i] + '/' + helperFiles[j]);
            if (typeof helper.register === 'function') {
              helper.register(this.Handlebars, this.config);
            }
          }
        }
      }
    }
  }

  // Compile the Handlebars template.
  this.template = fs.readFileSync(this.config.template + '/index.hbs', 'utf8');
  this.template = this.Handlebars.compile(this.template);

  return cb(null);
};

/**
 * Generate the HTML files of the style guide given a KssStyleguide object.
 *
 * @alias module:kss/generator/handlebars.generate
 * @param {KssStyleguide} styleguide The KSS style guide in object format.
 */
kssHandlebarsGenerator.generate = function(styleguide, cb) {
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

  cb = cb || /* istanbul ignore next */ function() {};

  if (this.config.verbose) {
    this.log(styleguide.data.files.map(function(file) {
      return ' - ' + file;
    }).join('\n'));
  }

  // Return an error if no KSS sections are found in the source files.
  if (sectionCount === 0) {
    return cb(Error('No KSS documentation discovered in source files.'));
  }

  if (this.config.verbose) {
    this.log('...Determining section markup:');
  }

  for (i = 0; i < sectionCount; i += 1) {
    // Register all the markup blocks as Handlebars partials.
    if (sections[i].markup()) {
      partial = {
        name: sections[i].reference(),
        reference: sections[i].reference(),
        file: '',
        markup: sections[i].markup(),
        data: {}
      };
      // If the markup is a file path, attempt to load the file.
      if (partial.markup.match(/^[^\n]+\.(html|hbs)$/)) {
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
          if (!this.config.verbose) {
            this.log('WARNING: In section ' + partial.reference + ', ' + partial.markup);
          }
        }
        if (this.config.verbose) {
          this.log(' - ' + partial.reference + ': ' + partial.markup);
        }
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
      } else if (this.config.verbose) {
        this.log(' - ' + partial.reference + ': inline markup');
      }
      // Register the partial using the filename (without extension) or using
      // the style guide reference.
      this.Handlebars.registerPartial(partial.name, partial.markup);
      // Save the name of the partial and its data for retrieval in the markup
      // helper, where we only know the reference.
      partials[partial.reference] = {
        name: partial.name,
        data: partial.data
      };
    }

    // Accumulate all of the sections' first indexes.
    currentRoot = sections[i].reference().split(/(?:\.|\ \-\ )/)[0];
    if (sectionRoots.indexOf(currentRoot) === -1) {
      sectionRoots.push(currentRoot);
    }
  }

  // If a root element doesn't have an actual section, build one for it.
  rootCount = sectionRoots.length;
  key = false;
  for (i = 0; i < rootCount; i += 1) {
    currentRoot = styleguide.section(sectionRoots[i]);
    if (currentRoot === false) {
      key = sectionRoots[i];
      styleguide.data.sections.push(new KssSection({
        header: key,
        reference: key
      }));
    }
  }
  if (key !== false) {
    styleguide.init();
  }

  if (this.config.verbose) {
    this.log('...Generating style guide pages:');
  }

  // Now, group all of the sections by their root
  // reference, and make a page for each.
  rootCount = sectionRoots.length;
  for (i = 0; i < rootCount; i += 1) {
    childSections = styleguide.section(sectionRoots[i] + '.*');

    this.generatePage(styleguide, childSections, sectionRoots[i], sectionRoots, partials);
  }

  // Generate the homepage.
  childSections = [];
  this.generatePage(styleguide, childSections, 'styleguide.homepage', sectionRoots, partials);

  cb(null);
};

/**
 * Renders the handlebars template for a section and saves it to a file.
 *
 * @alias module:kss/generator/handlebars.generatePage
 * @param {KssStyleguide} styleguide The KSS style guide in object format.
 * @param {Array} sections An array of KssSection objects.
 * @param {string} root The current section's reference.
 * @param {Array} sectionRoots An array of section references for all sections at the root of the style guide.
 * @param {Object} partials A hash of the names and data of the registered Handlebars partials.
 */
kssHandlebarsGenerator.generatePage = function(styleguide, sections, root, sectionRoots, partials) {
  var filename = '', files,
    homepageText = false,
    styles = '',
    scripts = '',
    customFields = this.config.custom,
    key;

  if (root === 'styleguide.homepage') {
    filename = 'index.html';
    if (this.config.verbose) {
      this.log(' - homepage');
    }
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
      if (this.config.verbose) {
        this.log('   ...no homepage content found in ' + this.config.homepage + '.');
      } else {
        this.log('WARNING: no homepage content found in ' + this.config.homepage + '.');
      }
    }
  } else {
    filename = 'section-' + KssSection.prototype.encodeReferenceURI(root) + '.html';
    if (this.config.verbose) {
      this.log(
        ' - section ' + root + ' [',
        styleguide.section(root) ? styleguide.section(root).header() : 'Unnamed',
        ']'
      );
    }
  }
  // Create the HTML to load the optional CSS and JS.
  for (key in this.config.css) {
    if (this.config.css.hasOwnProperty(key)) {
      styles = styles + '<link rel="stylesheet" href="' + this.config.css[key] + '">\n';
    }
  }
  for (key in this.config.js) {
    if (this.config.js.hasOwnProperty(key)) {
      scripts = scripts + '<script src="' + this.config.js[key] + '"></script>\n';
    }
  }

  /* eslint-disable key-spacing */
  fs.writeFileSync(this.config.destination + '/' + filename,
    this.template({
      partials:     partials,
      styleguide:   styleguide,
      sectionRoots: sectionRoots,
      sections:     sections.map(function(section) {
        return section.toJSON(customFields);
      }),
      rootName:     root,
      options:      this.config || {},
      homepage:     homepageText,
      styles:       styles,
      scripts:      scripts
    })
  );
  /* eslint-enable key-spacing */
};

module.exports = kssHandlebarsGenerator;
