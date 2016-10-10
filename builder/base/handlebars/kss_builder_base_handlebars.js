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
class KssBuilderBaseHandlebars extends KssBuilderBase {

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
      'extend': {
        group: 'Style guide:',
        string: true,
        path: true,
        describe: 'Location of modules to extend Handlebars; see http://bit.ly/kss-wiki'
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

      if (this.options.verbose) {
        this.log('');
        this.log('Building your KSS style guide!');
        this.log('');
        this.log(' * KSS Source  : ' + this.options.source.join(', '));
        this.log(' * Destination : ' + this.options.destination);
        this.log(' * Builder     : ' + this.options.builder);
        if (this.options.extend.length) {
          this.log(' * Extend      : ' + this.options.extend.join(', '));
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
                return (new RegExp('^(?!.*\\' + path.sep + '(node_modules$|\\.))')).test(relativePath);
              }
            }
          ).catch(() => {
            // If the builder does not have a kss-assets folder, ignore the error.
            return Promise.resolve();
          });
        })
      );

      // Load modules that extend Handlebars.
      this.options.extend.forEach(directory => {
        prepTasks.push(
          fs.readdirAsync(directory).then(files => {
            files.forEach(fileName => {
              if (path.extname(fileName) === '.js') {
                let extendFunction = require(path.join(directory, fileName));
                // istanbul ignore else
                if (typeof extendFunction === 'function') {
                  extendFunction(this.Handlebars, this.options);
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

    // istanbul ignore else
    if (typeof this.templates === 'undefined') {
      this.templates = {};
    }

    let buildTasks = [];

    // Compile the index.hbs Handlebars template.
    // istanbul ignore else
    if (typeof this.templates.index === 'undefined' || /* istanbul ignore next */ typeof this.templates.section === 'undefined') {
      buildTasks.push(
        fs.readFileAsync(path.resolve(this.options.builder, 'index.hbs'), 'utf8').then(content => {
          // istanbul ignore else
          if (typeof this.templates.index === 'undefined') {
            this.templates.index = this.Handlebars.compile(content);
          }
          // istanbul ignore else
          if (typeof this.templates.section === 'undefined') {
            this.templates.section = this.Handlebars.compile(content);
          }
          return Promise.resolve();
        })
      );
    }

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

    // Save the name of the partial and its context for retrieval in
    // buildPage(), where we only know the reference.
    let savePartial = partial => {
      // Register the partial using the file name (without extension) or using
      // the style guide reference.
      this.Handlebars.registerPartial(partial.name, partial.markup);
      if (partial.exampleMarkup) {
        this.Handlebars.registerPartial(partial.exampleName, partial.exampleMarkup);
      }
      this.partials[partial.reference] = {
        name: partial.name,
        context: partial.context,
        exampleName: partial.exampleMarkup ? partial.exampleName : false,
        exampleContext: partial.exampleContext
      };

      return Promise.resolve();
    };

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
      let partial = {
        name: section.reference(),
        reference: section.reference(),
        file: '',
        markup: section.markup(),
        context: {},
        exampleName: false,
        exampleMarkup: '',
        exampleContext: {}
      };

      // Check if the markup is a file path.
      if (!partial.markup.match(/^[^\n]+\.(html|hbs)$/)) {
        if (this.options.verbose) {
          this.log(' - ' + partial.reference + ': inline markup');
        }
        buildTasks.push(
          savePartial(partial)
        );
      } else {
        // Attempt to load the file path.
        partial.file = partial.markup;
        partial.name = path.basename(partial.file, path.extname(partial.file));
        partial.exampleName = 'kss-example-' + partial.name;

        let findPartials = [],
          matchFilename = path.basename(partial.file),
          matchExampleFilename = 'kss-example-' + matchFilename;
        this.options.source.forEach(source => {
          findPartials.push(glob(source + '/**/' + partial.file));
          findPartials.push(glob(source + '/**/' + matchExampleFilename));
        });
        buildTasks.push(
          Promise.all(findPartials).then(globMatches => {
            let foundPartial = false,
              foundExample = false,
              readPartials = [];
            for (let files of globMatches) {
              if (!foundPartial || !foundExample) {
                for (let file of files) {
                  // Read the partial from the first matched path.
                  let filename = path.basename(file);
                  if (!foundPartial && filename === matchFilename) {
                    foundPartial = true;
                    partial.file = file;
                    readPartials.push(
                      fs.readFileAsync(partial.file, 'utf8').then(contents => {
                        partial.markup = contents;
                        // Load sample context for the partial from the sample
                        // .json file.
                        try {
                          partial.context = require(path.join(path.dirname(file), partial.name + '.json'));
                        } catch (error) {
                          partial.context = {};
                        }
                        return Promise.resolve();
                      })
                    );
                  } else if (!foundExample && filename === matchExampleFilename) {
                    foundExample = true;
                    readPartials.push(
                      fs.readFileAsync(file, 'utf8').then(contents => {
                        partial.exampleMarkup = contents;
                        // Load sample context for the partial from the sample
                        // .json file.
                        try {
                          partial.exampleContext = require(path.join(path.dirname(file), partial.exampleName + '.json'));
                        } catch (error) {
                          // istanbul ignore next
                          partial.exampleContext = {};
                        }
                        return Promise.resolve();
                      })
                    );
                  }
                }
              }
            }

            // If the markup file is not found, note that in the style guide.
            if (!foundPartial && !foundExample) {
              partial.markup += ' NOT FOUND!';
              if (!this.options.verbose) {
                this.log('WARNING: In section ' + partial.reference + ', ' + partial.markup);
              }
            } else /* istanbul ignore if */ if (!foundPartial) {
              // If we found an example, but no partial, register an empty
              // partial.
              partial.markup = '{{! Cannot be an empty string. }}';
            }

            if (this.options.verbose) {
              this.log(' - ' + partial.reference + ': ' + partial.markup);
            }

            return Promise.all(readPartials).then(() => {
              return partial;
            });
          }).then(savePartial)
        );
      }
    });

    return Promise.all(buildTasks).then(() => {
      if (this.options.verbose) {
        this.log('...Building style guide pages:');
      }

      let buildPageTasks = [];

      // Build the homepage.
      buildPageTasks.push(this.buildPage('index', null, []));

      // Group all of the sections by their root reference, and make a page for
      // each.
      sectionRoots.forEach(rootReference => {
        buildPageTasks.push(this.buildPage('section', rootReference, this.styleGuide.sections(rootReference + '.*')));
      });

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
   * Renders the Handlebars template for a section and saves it to a file.
   *
   * @param {string} templateName The name of the template to use.
   * @param {string|null} pageReference The reference of the current page's root
   *   section, or null if the current page is the homepage.
   * @param {Array} sections An array of KssSection objects.
   * @param {Object} [context] Additional context to give to the Handlebars
   *   template when it is rendered.
   * @returns {Promise} A `Promise` object.
   */
  buildPage(templateName, pageReference, sections, context) {
    context = context || {};
    context.styleGuide = this.styleGuide;
    context.sections = sections.map(section => {
      return section.toJSON();
    });
    context.hasNumericReferences = this.styleGuide.hasNumericReferences();
    context.partials = this.partials;
    context.options = this.options || /* istanbul ignore next */ {};

    // Render the template for each section markup and modifier.
    context.sections.forEach(section => {
      // If the section does not have any markup, render an empty string.
      if (section.markup) {
        // Load the information about this section's markup partial.
        let partialInfo = this.partials[section.reference];
        let template = this.Handlebars.compile('{{> "' + partialInfo.name + '"}}');

        // Copy the template.context so we can modify it.
        let data = JSON.parse(JSON.stringify(partialInfo.context));

        /* eslint-disable camelcase */

        // Display the placeholder if the section has modifiers.
        data.modifier_class = data.modifier_class || '';
        if (section.modifiers.length !== 0 && this.options.placeholder) {
          data.modifier_class += (data.modifier_class ? ' ' : '') + this.options.placeholder;
        }

        // We don't wrap the rendered template in "new handlebars.SafeString()" since
        // we want the ability to display it as a code sample with {{ }} and as
        // rendered HTML with {{{ }}}.
        section.markup = template(data);
        section.example = section.markup;

        let templateContext;
        if (partialInfo.exampleName) {
          template = this.Handlebars.compile('{{> "' + partialInfo.exampleName + '"}}');
          templateContext = partialInfo.exampleContext;

          // Re-render the example variable with the example partial.
          data = JSON.parse(JSON.stringify(templateContext));
          data.modifier_class = data.modifier_class || /* istanbul ignore next */ '';
          // istanbul ignore else
          if (section.modifiers.length !== 0 && this.options.placeholder) {
            data.modifier_class += (data.modifier_class ? ' ' : /* istanbul ignore next */ '') + this.options.placeholder;
          }
          section.example = template(data);
        } else {
          templateContext = partialInfo.context;
        }


        section.modifiers.forEach(modifier => {
          let data = JSON.parse(JSON.stringify(templateContext));
          data.modifier_class = (data.modifier_class ? data.modifier_class + ' ' : '') + modifier.className;
          modifier.markup = template(data);
        });
        /* eslint-enable camelcase */
      }
    });

    // Create the HTML to load the optional CSS and JS (if a sub-class hasn't already built it.)
    // istanbul ignore else
    if (typeof context.styles === 'undefined') {
      context.styles = '';
      for (let key in this.options.css) {
        // istanbul ignore else
        if (this.options.css.hasOwnProperty(key)) {
          context.styles = context.styles + '<link rel="stylesheet" href="' + this.options.css[key] + '">\n';
        }
      }
    }
    // istanbul ignore else
    if (typeof context.scripts === 'undefined') {
      context.scripts = '';
      for (let key in this.options.js) {
        // istanbul ignore else
        if (this.options.js.hasOwnProperty(key)) {
          context.scripts = context.scripts + '<script src="' + this.options.js[key] + '"></script>\n';
        }
      }
    }

    // Create a menu for the page (if a sub-class hasn't already built one.)
    // istanbul ignore else
    if (typeof context.menu === 'undefined') {
      context.menu = this.createMenu(pageReference);
    }

    // Create a list of breakpoints (if a sub-class hasn't already built one.)
    // istanbul ignore else
    if (typeof context.breakpoints === 'undefined') {
      context.breakpoints = [];
      for (let key in this.options.breakpoint) {
        // istanbul ignore else
        if (this.options.breakpoint.hasOwnProperty(key)) {
          context.breakpoints.push(this.options.breakpoint[key].split(' '));
        }
      }
    }

    // Determine the file name to use for this page.
    if (pageReference) {
      let rootSection = this.styleGuide.sections(pageReference);
      if (this.options.verbose) {
        this.log(
          ' - ' + templateName + ' ' + pageReference
          + ' ['
          + (rootSection.header() ? rootSection.header() : /* istanbul ignore next */ 'Unnamed')
          + ']'
        );
      }
      // Convert the pageReference to be URI-friendly.
      pageReference = rootSection.referenceURI();
    } else if (this.options.verbose) {
      this.log(' - homepage');
    }
    let fileName = templateName + (pageReference ? '-' + pageReference : '') + '.html';

    // Grab the homepage text if it hasn't already been provided.
    let getHomepageText;
    if (templateName === 'index' && typeof context.homepage === 'undefined') {
      getHomepageText = Promise.all(
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
        // Ensure homePageText is a non-false value. And run any results through
        // Markdown.
        context.homepage = homePageText ? marked(homePageText) : ' ';
        return Promise.resolve();
      });
    } else {
      getHomepageText = Promise.resolve();
      context.homepage = false;
    }

    return getHomepageText.then(() => {
      // Render the template and save it to the destination.
      return fs.writeFileAsync(
        path.join(this.options.destination, fileName),
        this.templates[templateName](context)
      );
    });
  }
}

module.exports = KssBuilderBaseHandlebars;
