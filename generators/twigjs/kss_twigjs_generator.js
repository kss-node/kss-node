var KssTwigJSGenerator,
  KssGenerator = require('../kss_generator.js'),
  KssSection = require('../../lib/kss_section.js'),
  fs = require('fs'),
  glob = require('glob'),
  marked = require('marked'),
  path = require('path'),
  wrench = require('wrench');

/**
 * Export KssTwigJSGenerator.
 *
 * Pass a string to KssGenerator() that tells the generator which API version is
 * implemented by KssTwigJSGenerator.
 */
module.exports = KssTwigJSGenerator = new KssGenerator('2.0');

/**
 * Initialize the style guide creation process.
 *
 * This method is given a KssGeneratorConfig object with the details of the
 * requested style guide generation. The generator can use this information for
 * any necessary tasks before the KSS parsing of the source files.
 *
 * @param {KssGeneratorConfig} config Configuration object for the style guide generation.
 */
KssTwigJSGenerator.init = function(config) {
  var i, helper;

  // Save the configuration parameters.
  this.config = config;

  console.log('');
  console.log('TwigJS is generating your KSS style guide!');
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

  // Store the global TwigJS object.
  var TwigJS = require('twig/twig.js');
  this.Twig = TwigJS.twig;

  // Load TwigJS helpers.
  if (fs.existsSync(this.config.helpers)) {
    // Load custom TwigJS helpers.
    var helperFiles = fs.readdirSync(this.config.helpers);

    for (i = 0; i < helperFiles.length; i++) {
      if (path.extname(helperFiles[i]) !== '.js') {
        return;
      }
      helper = require(this.config.helpers + '/' + helperFiles[i]);
      if (typeof helper.register === 'function') {
        helper.register(TwigJS, this.config);
      }
    }
  }

  // Load the standard TwigJS helpers.
  require('./helpers.js').register(TwigJS, this.config);

  // Compile the TwigJS template.
  this.template = fs.readFileSync(this.config.template + '/index.html', 'utf8');
  this.template = this.Twig({data: this.template});
};

/**
 * Generate the HTML files of the style guide given a KssStyleguide object.
 *
 * @param {KssStyleguide} styleguide The KSS style guide in object format.
 */
KssTwigJSGenerator.generate = function(styleguide) {
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
    throw 'No KSS documentation discovered in source files.';
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
      }
      else {
        console.log(' - ' + partial.reference + ': inline markup');
      }
      // Register the partial using the filename (without extension) or using
      // the style guide reference.
      // Save the name of the partial and its data for retrieval in the markup
      // helper, where we only know the reference.
      partials[partial.reference] = this.Twig({
        id: partial.name,
        data: partial.markup,
        variables: partial.data
      });
    }

    // Accumulate all of the sections' first indexes
    // in case they don't have a root element.
    currentRoot = sections[i].reference().split(/(?:\.|\s+\-\s+)/)[0];
    if (sectionRoots.indexOf(currentRoot) === -1) {
      sectionRoots.push(currentRoot);
    }
  }

  console.log('...Generating style guide sections:');

  // Now, group all of the sections by their root
  // reference, and make a page for each.
  rootCount = sectionRoots.length;
  for (i = 0; i < rootCount; i += 1) {
    childSections = styleguide.section(sectionRoots[i]+'.*');
    this.generatePage(styleguide, childSections, sectionRoots[i], sectionRoots, partials);
  }

  // Generate the homepage.
  childSections = [];
  this.generatePage(styleguide, childSections, 'styleguide.homepage', sectionRoots, partials);
};

/**
 * Renders the TwigJS template for a section and saves it to a file.
 *
 * @param {KssStyleguide} styleguide The KSS style guide in object format.
 */
KssTwigJSGenerator.generatePage = function(styleguide, sections, root, sectionRoots, partials) {
  var filename = '', files,
    homepageText = false,
    styles = '',
    scripts = '',
    customFields = this.config.custom,
    key;

  if (root == 'styleguide.homepage') {
    filename = 'index.html';
    console.log(' - homepage');
    // Ensure homepageText is a non-false value.
    for (key in this.config.source) {
      if (!homepageText) {
        try {
          files = glob.sync(this.config.source[key] + '/**/styleguide.md');
          if (files.length) {
            homepageText = ' ' + marked(fs.readFileSync(files[0], 'utf8'));
          }
        } catch (e) {}
      }
    }
    if (!homepageText) {
      homepageText = ' ';
      console.log('   ...no homepage content found in styleguide.md.');
    }
  }
  else {
    filename = 'section-' + KssSection.prototype.encodeReferenceURI(root) + '.html';
    console.log(
      ' - section '+root+' [',
      styleguide.section(root) ? styleguide.section(root).header() : 'Unnamed',
      ']'
    );
  }
  // Create the HTML to load the optional CSS and JS.
  for (key in this.config.css) {
    styles = styles + '<link rel="stylesheet" href="' + this.config.css[key] + '">\n';
  }
  for (key in this.config.js) {
    scripts = scripts + '<script src="' + this.config.js[key] + '"></script>\n';
  }

  fs.writeFileSync(this.config.destination + '/' + filename,
    this.template.render({
      partials:     partials,
      styleguide:   styleguide,
      sectionRoots: sectionRoots,
      sections:     sections.map(function(section) {
        section.markup = section.markup(); // flatten markup into a string
        return section.JSON(customFields);
      }),
      rootName:     root,
      argv:         this.config || {},
      homepage:     homepageText,
      styles:       styles,
      scripts:      scripts
    })
  );
};
