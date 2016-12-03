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
      extend: {
        group: 'Style guide:',
        string: true,
        path: true,
        describe: 'Location of modules to extend Handlebars; see http://bit.ly/kss-wiki'
      },
      homepage: {
        group: 'Style guide:',
        string: true,
        multiple: false,
        describe: 'File name of the homepage\'s Markdown file',
        default: 'homepage.md'
      },
      placeholder: {
        group: 'Style guide:',
        string: true,
        multiple: false,
        describe: 'Placeholder text to use for modifier classes',
        default: '[modifier class]'
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
      if (this.options.verbose) {
        this.log('');
      }

      // Store the global Handlebars object.
      this.Handlebars = require('handlebars');

      let prepTasks = [];

      // Create a new destination directory.
      prepTasks.push(this.prepareDestination('kss-assets'));

      // Load modules that extend Handlebars.
      Array.prototype.push.apply(prepTasks, this.prepareExtend(this.Handlebars));

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
    let options = {};
    // Returns a promise to read/load a template provided by the builder.
    options.readBuilderTemplate = name => {
      return fs.readFileAsync(path.resolve(this.options.builder, name + '.hbs'), 'utf8').then(content => {
        return this.Handlebars.compile(content);
      });
    };
    // Returns a promise to read/load a template specified by a section.
    options.readSectionTemplate = (name, filepath) => {
      return fs.readFileAsync(filepath, 'utf8').then(contents => {
        this.Handlebars.registerPartial(name, contents);
        return contents;
      });
    };
    // Returns a promise to load an inline template from markup.
    options.loadInlineTemplate = (name, markup) => {
      this.Handlebars.registerPartial(name, markup);
      return Promise.resolve();
    };
    // Converts a filename into a Handlebars partial name.
    options.filenameToTemplateRef = filename => {
      // Return the filename without the full path or the file extension.
      return path.basename(filename, path.extname(filename));
    };
    options.templateExtension = 'hbs';
    options.emptyTemplate = '{{! Cannot be an empty string. }}';

    return this.buildGuide(styleGuide, options);
  }

  /**
   * Renders the Handlebars template for a section and saves it to a file.
   *
   * @param {string} templateName The name of the template to use.
   * @param {string|null} pageReference The reference of the current page's root
   *   section, or null if the current page is the homepage.
   * @param {Array} sections An array of KssSection objects.
   * @param {Object} [context] Additional context to give to the template when
   *   it is rendered.
   * @returns {Promise} A `Promise` object.
   */
  buildPage(templateName, pageReference, sections, context) {
    context = context || {};
    context.template = {
      isHomepage: templateName === 'index',
      isSection: templateName === 'section',
      isItem: templateName === 'item'
    };
    context.styleGuide = this.styleGuide;
    context.sections = sections.map(section => {
      return section.toJSON();
    });
    context.hasNumericReferences = this.styleGuide.hasNumericReferences();
    context.sectionTemplates = this.sectionTemplates;
    context.options = this.options || /* istanbul ignore next */ {};

    // Render the template for each section markup and modifier.
    return Promise.all(
      context.sections.map(section => {
        // If the section does not have any markup, render an empty string.
        if (section.markup) {
          // Load the information about this section's markup template.
          let templateInfo = this.sectionTemplates[section.reference];
          let template = this.Handlebars.compile('{{> "' + templateInfo.name + '"}}');

          // Copy the template.context so we can modify it.
          let data = JSON.parse(JSON.stringify(templateInfo.context));

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
          if (templateInfo.exampleName) {
            template = this.Handlebars.compile('{{> "' + templateInfo.exampleName + '"}}');
            templateContext = templateInfo.exampleContext;

            // Re-render the example variable with the example partial.
            data = JSON.parse(JSON.stringify(templateContext));
            data.modifier_class = data.modifier_class || /* istanbul ignore next */ '';
            // istanbul ignore else
            if (section.modifiers.length !== 0 && this.options.placeholder) {
              data.modifier_class += (data.modifier_class ? ' ' : /* istanbul ignore next */ '') + this.options.placeholder;
            }
            section.example = template(data);
          } else {
            templateContext = templateInfo.context;
          }

          section.modifiers.forEach(modifier => {
            let data = JSON.parse(JSON.stringify(templateContext));
            data.modifier_class = (data.modifier_class ? data.modifier_class + ' ' : '') + modifier.className;
            modifier.markup = template(data);
          });
          /* eslint-enable camelcase */
        }
        return Promise.resolve();
      })
    ).then(() => {

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

      let getHomepageText;
      if (templateName !== 'index') {
        getHomepageText = Promise.resolve();
        context.homepage = false;
      } else {
        // Grab the homepage text if it hasn't already been provided.
        getHomepageText = (typeof context.homepage !== 'undefined') ? /* istanbul ignore next */ Promise.resolve() : Promise.all(
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
          context.homepage = homePageText ? marked(homePageText) : '';
          return Promise.resolve();
        });
      }

      return getHomepageText.then(() => {
        // Render the template and save it to the destination.
        return fs.writeFileAsync(
          path.join(this.options.destination, fileName),
          this.templates[templateName](context)
        );
      });
    });
  }
}

module.exports = KssBuilderBaseHandlebars;
