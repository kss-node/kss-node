'use strict';

/**
 * The `kss/builder/base/handlebars` module loads the KssBuilderBaseHandlebars
 * class, a `{@link KssBuilderBase}` sub-class using Handlebars templating.
 * ```
 * const KssBuilderBaseHandlebars = require('kss/builder/base/handlebars');
 * ```
 * @module kss/builder/base/handlebars
 */

const KssBuilderBase = require('../kss_builder_base.js'),
  marked = require('marked'),
  path = require('path'),
  Promise = require('bluebird');

const fs = Promise.promisifyAll(require('fs-extra')),
  glob = Promise.promisify(require('glob'));

/**
 * A kss-node builder takes input files and builds a style guide using
 * Handlebars templates.
 */
class KssBuilderBaseTwig extends KssBuilderBase {

  /**
   * Create a KssBuilderBaseHandlebars object.
   *
   * ```
   * const KssBuilderBaseHandlebars = require('kss/builder/base/handlebars');
   * const builder = new KssBuilderBaseHandlebars();
   * ```
   */
  constructor() {
    super();

    // Store the version of the builder API that the builder instance is
    // expecting; we will verify this in loadBuilder().
    this.API = '3.0';

    // Tell kss-node which Yargs-like options this builder has.
    this.addOptionDefinitions({
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
        default: 'homepage.md'
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
  }

  /**
   * Allow the builder to preform pre-build tasks or modify the KssStyleGuide
   * object.
   *
   * The method can be set by any KssBuilderBase sub-class to do any custom
   * tasks after the KssStyleGuide object is created and before the HTML style
   * guide is built.
   *
   * @param {KssStyleGuide} styleGuide The KSS style guide in object format.
   * @returns {Promise.<null>} A `Promise` object resolving to `null`.
   */
  prepare(styleGuide) {
    return super.prepare(styleGuide).then(styleGuide => {
      // Store the global Handlebars object.
      this.Handlebars = require('handlebars');

      // Load the standard Handlebars helpers.
      require('./helpers.js').register(this.Handlebars, this.options);

      if (this.options.verbose) {
        this.log('');
        this.log('Building your KSS style guide!');
        this.log('');
        this.log(' * KSS Source  : ' + this.options.source.join(', '));
        this.log(' * Destination : ' + this.options.destination);
        this.log(' * Builder     : ' + this.options.builder);
        if (this.options.helpers.length) {
          this.log(' * Helpers     : ' + this.options.helpers.join(', '));
        }
        this.log('');
      }

      let prepTasks = [];

      // Create a new destination directory.
      prepTasks.push(
        fs.mkdirsAsync(this.options.destination).then(() => {
          // Optionally, copy the contents of the builder's "kss-assets" folder.
          return fs.copyAsync(
            path.join(this.options.builder, 'kss-assets'),
            path.join(this.options.destination, 'kss-assets'),
            {
              clobber: true,
              filter: filePath => {
                // Only look at the part of the path inside the builder.
                let relativePath = path.sep + path.relative(this.options.builder, filePath);
                // Skip any files with a path matching: /node_modules or /.
                return (new RegExp('^(?!.*' + path.sep + '(node_modules$|\\.))')).test(relativePath);
              }
            }
          ).catch(() => {
            // If the builder does not have a kss-assets folder, ignore the error.
            return Promise.resolve();
          });
        })
      );

      // Load Handlebars helpers.
      this.options.helpers.forEach(directory => {
        prepTasks.push(
          fs.readdirAsync(directory).then(helperFiles => {
            helperFiles.forEach(fileName => {
              if (path.extname(fileName) === '.js') {
                let helper = require(path.join(directory, fileName));
                // istanbul ignore else
                if (typeof helper.register === 'function') {
                  helper.register(this.Handlebars, this.options);
                }
              }
            });
          })
        );
      });

      return Promise.all(prepTasks).then(() => {
        return Promise.resolve(styleGuide);
      });
    });
  }

  /**
   * Build the HTML files of the style guide given a KssStyleGuide object.
   *
   * @param {KssStyleGuide} styleGuide The KSS style guide in object format.
   * @returns {Promise.<KssStyleGuide>} A `Promise` object resolving to a
   *   `KssStyleGuide` object.
   */
  build(styleGuide) {
    this.styleGuide = styleGuide;
    this.partials = {};

    let buildTasks = [];

    // Compile the Handlebars template.
    buildTasks.push(
      fs.readFileAsync(path.resolve(this.options.builder, 'index.html'), 'utf8').then(content => {
        this.template = this.Handlebars.compile(content);
        return Promise.resolve();
      })
    );

    let sections = this.styleGuide.sections();

    if (this.options.verbose && this.styleGuide.meta.files) {
      this.log(this.styleGuide.meta.files.map(file => {
        return ' - ' + file;
      }).join('\n'));
    }

    if (this.options.verbose) {
      this.log('...Determining section markup:');
    }

    let sectionRoots = [];

    sections.forEach(section => {
      // Accumulate an array of section references for all sections at the root
      // of the style guide.
      let currentRoot = section.reference().split(/(?:\.|\ \-\ )/)[0];
      if (sectionRoots.indexOf(currentRoot) === -1) {
        sectionRoots.push(currentRoot);
      }

      if (!section.markup()) {
        return;
      }

      // Register all the markup blocks as Handlebars partials.
      let findPartial,
        partial = {
          name: section.reference(),
          reference: section.reference(),
          file: '',
          markup: section.markup(),
          data: {}
        };
      // If the markup is a file path, attempt to load the file.
      if (partial.markup.match(/^[^\n]+\.(html|hbs)$/)) {
        partial.file = partial.markup;
        partial.name = path.basename(partial.file, path.extname(partial.file));

        findPartial = Promise.all(
          this.options.source.map(source => {
            return glob(source + '/**/' + partial.file);
          })
        ).then(globMatches => {
          for (let files of globMatches) {
            if (files.length) {
              // Read the file contents from the first matched path.
              partial.file = files[0];
              return fs.readFileAsync(partial.file, 'utf8');
            }
          }

          // If the markup file is not found, note that in the style guide.
          partial.markup += ' NOT FOUND!';
          if (!this.options.verbose) {
            this.log('WARNING: In section ' + partial.reference + ', ' + partial.markup);
          }
          return '';
        }).then(contents => {
          if (this.options.verbose) {
            this.log(' - ' + partial.reference + ': ' + partial.markup);
          }
          if (contents) {
            partial.markup = contents;
            // Load sample data for the partial from the sample .json file.
            try {
              partial.data = require(path.join(path.dirname(partial.file), partial.name + '.json'));
            } catch (error) {
              partial.data = {};
            }
          }
          return partial;
        });
      } else {
        if (this.options.verbose) {
          this.log(' - ' + partial.reference + ': inline markup');
        }
        findPartial = Promise.resolve(partial);
      }

      buildTasks.push(
        findPartial.then(partial => {
          // Register the partial using the file name (without extension) or using
          // the style guide reference.
          this.Handlebars.registerPartial(partial.name, partial.markup);
          // Save the name of the partial and its data for retrieval in the markup
          // helper, where we only know the reference.
          this.partials[partial.reference] = {
            name: partial.name,
            data: partial.data
          };

          return Promise.resolve();
        })
      );
    });

    return Promise.all(buildTasks).then(() => {
      if (this.options.verbose) {
        this.log('...Building style guide pages:');
      }

      // Group all of the sections by their root reference, and make a page for
      // each.
      let buildPageTasks = sectionRoots.map(rootReference => {
        return this.buildPage(rootReference, this.styleGuide.sections(rootReference + '.*'));
      });

      // Build the homepage.
      buildPageTasks.push(this.buildPage('styleGuide.homepage', []));

      return Promise.all(buildPageTasks);
    }).then(() => {
      // We return the KssStyleGuide, just like KssBuilderBase.build() does.
      return Promise.resolve(styleGuide);
    });
  }

  /**
   * Creates a 2-level hierarchical menu from the style guide.
   *
   * @param {string} pageReference The reference of the root section of the page
   *   being built.
   * @returns {Array} An array of menu items that can be used as a Handlebars
   *   variable.
   */
  createMenu(pageReference) {
    // Helper function that converts a section to a menu item.
    const toMenuItem = function(section) {
      // @TODO: Add an option to "include" the specific properties returned.
      let menuItem = section.toJSON();

      // Remove data we definitely won't need for the menu.
      delete menuItem.markup;
      delete menuItem.modifiers;
      delete menuItem.parameters;

      // Mark the current page in the menu.
      menuItem.isActive = (menuItem.reference === pageReference);

      // Mark any "deep" menu items.
      menuItem.isGrandChild = (menuItem.depth > 2);

      return menuItem;
    };

    // Retrieve all the root sections of the style guide.
    return this.styleGuide.sections('x').map(rootSection => {
      let menuItem = toMenuItem(rootSection);

      // Retrieve the child sections for each of the root sections.
      menuItem.children = this.styleGuide.sections(rootSection.reference() + '.*').slice(1).map(toMenuItem);

      // Remove menu items that are deeper than the nav-depth option.
      for (let i = 0; i < menuItem.children.length; i++) {
        if (menuItem.children[i].depth > this.options['nav-depth']) {
          delete menuItem.children[i];
        }
      }

      return menuItem;
    });
  }

  /**
   * Renders the handlebars template for a section and saves it to a file.
   *
   * @param {string} pageReference The reference of the current page's root
   *   section.
   * @param {Array} sections An array of KssSection objects.
   * @returns {Promise} A `Promise` object.
   */
  buildPage(pageReference, sections) {
    let getFileInfo;

    // Create a Promise resulting in the homepage file information.
    if (pageReference === 'styleGuide.homepage') {
      let fileInfo = {
        fileName: 'index.html',
        homePageText: false
      };
      if (this.options.verbose) {
        this.log(' - homepage');
      }

      getFileInfo = Promise.all(
        this.options.source.map(source => {
          return glob(source + '/**/' + this.options.homepage);
        })
      ).then(globMatches => {
        for (let files of globMatches) {
          if (files.length) {
            // Read the file contents from the first matched path.
            return fs.readFileAsync(files[0], 'utf8');
          }
        }

        if (this.options.verbose) {
          this.log('   ...no homepage content found in ' + this.options.homepage + '.');
        } else {
          this.log('WARNING: no homepage content found in ' + this.options.homepage + '.');
        }
        return '';
      }).then(homePageText => {
        // Ensure homePageText is a non-false value.
        fileInfo.homePageText = homePageText ? marked(homePageText) : ' ';
        return fileInfo;
      });

      // Create a Promise resulting in the non-homepage file information.
    } else {
      let rootSection = this.styleGuide.sections(pageReference),
        fileInfo = {
          fileName: 'section-' + rootSection.referenceURI() + '.html',
          homePageText: false
        };
      if (this.options.verbose) {
        this.log(
          ' - section ' + pageReference + ' [',
          rootSection.header() ? rootSection.header() : /* istanbul ignore next */ 'Unnamed',
          ']'
        );
      }
      getFileInfo = Promise.resolve(fileInfo);
    }

    return getFileInfo.then(fileInfo => {
      // Create the HTML to load the optional CSS and JS.
      let styles = '',
        scripts = '';
      for (let key in this.options.css) {
        // istanbul ignore else
        if (this.options.css.hasOwnProperty(key)) {
          styles = styles + '<link rel="stylesheet" href="' + this.options.css[key] + '">\n';
        }
      }
      for (let key in this.options.js) {
        // istanbul ignore else
        if (this.options.js.hasOwnProperty(key)) {
          scripts = scripts + '<script src="' + this.options.js[key] + '"></script>\n';
        }
      }

      return fs.writeFileAsync(path.join(this.options.destination, fileInfo.fileName),
        this.template({
          pageReference: pageReference,
          sections: sections.map(section => {
            return section.toJSON();
          }),
          menu: this.createMenu(pageReference),
          homepage: fileInfo.homePageText,
          styles: styles,
          scripts: scripts,
          hasNumericReferences: this.styleGuide.hasNumericReferences(),
          partials: this.partials,
          styleGuide: this.styleGuide,
          options: this.options || /* istanbul ignore next */ {}
        })
      );
    });
  }
}

module.exports = KssBuilderBaseTwig;
