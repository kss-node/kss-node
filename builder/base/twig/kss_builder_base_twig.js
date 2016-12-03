'use strict';

/**
 * The `kss/builder/base/twig` module loads the KssBuilderBaseTwig
 * class, a `{@link KssBuilderBase}` sub-class using Twig.js templating.
 * ```
 * const KssBuilderBaseTwig = require('kss/builder/base/twig');
 * ```
 * @module kss/builder/base/twig
 */

const KssBuilderBase = require('../kss_builder_base.js'),
  marked = require('marked'),
  path = require('path'),
  Promise = require('bluebird');

const fs = Promise.promisifyAll(require('fs-extra')),
  glob = Promise.promisify(require('glob'));

/**
 * A kss-node builder takes input files and builds a style guide using
 * Twig.js templates.
 */
class KssBuilderBaseTwig extends KssBuilderBase {

  /**
   * Create a KssBuilderBaseTwig object.
   *
   * ```
   * const KssBuilderBaseTwig = require('kss/builder/base/twig');
   * const builder = new KssBuilderBaseTwig();
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
        describe: 'Location of modules to extend Twig.js; see http://bit.ly/kss-wiki'
      },
      'extend-drupal8': {
        group: 'Style guide:',
        boolean: true,
        default: false,
        multiple: false,
        describe: 'Extend Twig.js using kss\'s Drupal 8 extensions'
      },
      'namespace': {
        group: 'Style guide:',
        string: true,
        describe: 'Adds a Twig namespace, given the formatted string: "namespace:path"'
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
      // Collect the namespaces to be used by Twig.
      this.namespaces = {
        builderTwig: path.resolve(this.options.builder)
      };
      this.options.namespace.forEach(namespace => {
        // namespace should be of the form "namespace:path";
        let tokens = namespace.split(':', 2);
        if (tokens[1]) {
          this.namespaces[tokens[0]] = path.resolve(tokens[1]);
        }
      });

      if (this.options.verbose) {
        if (this.options.namespace.length) {
          this.log(' * Namespace   : ' + this.options.namespace.join(', '));
        }
        this.log('');
      }

      // Store the global Twig object.
      this.Twig = require('twig');

      // We need the ability to reset the template registry since the global
      // Twig object is the same object every time it is require()d.
      this.Twig.registryReset = (function() {
        this.extend(function(Twig) {
          Twig.Templates.registry = {};
        });
      }).bind(this.Twig);

      // Promisify Twig.twig().
      let namespacesFromKSS = this.namespaces;
      this.Twig.twigAsync = (function(options) {
        return new Promise((resolve, reject) => {
          // Use our Promise's functions.
          options.load = resolve;
          options.error = reject;
          // We enforce some options.
          options.async = true;
          options.autoescape = true;
          options.namespaces = namespacesFromKSS;

          // twig() ignores options.load/error if data or ref are specified.
          if (options.data || options.ref) {
            try {
              resolve(this.twig(options));
            } catch (error) {
              // istanbul ignore next
              reject(error);
            }
          } else {
            // In 0.10.2 and earlier, twig.js incorrectly "throws" an error if
            // the path is not a valid file. So we have to double check for an
            // error and use reject() before calling twig().
            // @TODO Remove after upstream fix. https://github.com/twigjs/twig.js/pull/431
            fs.stat(options.path, (err, stats) => {
              if (err || !stats.isFile()) {
                reject(new Error('Unable to find template file ' + options.path));
                return;
              }
              // Call twig() with our load/error callbacks.
              this.twig(options);
            });
          }
        });
      }).bind(this.Twig);

      // The this.safeMarkup() function recursively goes through the given JSON
      // object and marks all properties as safe markup.
      let safeMarkup;
      this.Twig.extend(Twig => {
        safeMarkup = function(input) {
          if (typeof input === 'string' || typeof input === 'number' || typeof input === 'boolean') {
            return Twig.Markup(input);
          } else if (Array.isArray(input)) {
            return input.map(safeMarkup);
          } else if (input && typeof input === 'object') {
            for (let key in input) {
              // istanbul ignore else
              if (input.hasOwnProperty(key)) {
                input[key] = safeMarkup(input[key]);
              }
            }
            return input;
          }
          return input;
        };
      });
      this.safeMarkup = safeMarkup;

      let prepTasks = [];

      // Create a new destination directory.
      prepTasks.push(this.prepareDestination('kss-assets'));

      // Load modules that extend Twig.
      if (this.options['extend-drupal8']) {
        this.options.extend.unshift(path.resolve(__dirname, 'extend-drupal8'));
      }
      Array.prototype.push.apply(prepTasks, this.prepareExtend(this.Twig));

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
      return this.Twig.twigAsync({
        id: '@builderTwig/' + name + '.twig',
        path: path.resolve(this.options.builder, name + '.twig')
      });
    };
    // Returns a promise to read/load a template specified by a section.
    options.readSectionTemplate = (name, filepath) => {
      return this.Twig.twigAsync({
        id: name,
        path: filepath
      });
    };
    // Returns a promise to load an inline template from markup.
    options.loadInlineTemplate = (name, markup) => {
      return this.Twig.twigAsync({
        id: name,
        data: markup
      });
    };
    // Converts a filename into a Twig template name.
    options.filenameToTemplateRef = filename => {
      // Return the filename without the full path.
      return path.basename(filename);
    };
    options.templateExtension = 'twig';
    options.emptyTemplate = '{# Cannot be an empty string. #}';

    // Reset the Twig template registry so KSS can be run in a "watch" task that
    // does not destroy the Node.js environment between builds.
    this.Twig.registryReset();

    return this.buildGuide(styleGuide, options);
  }

  /**
   * Renders the Twig template for a section and saves it to a file.
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
        if (section.markup) {
          // Load the information about this section's markup template.
          let templateInfo = this.sectionTemplates[section.reference];
          return this.Twig.twigAsync({
            ref: templateInfo.name
          }).then(template => {
            // Copy the template.context so we can modify it.
            let data = JSON.parse(JSON.stringify(templateInfo.context));

            /* eslint-disable camelcase */

            // Display the placeholder if the section has modifiers.
            data.modifier_class = data.modifier_class || '';
            if (section.modifiers.length !== 0 && this.options.placeholder) {
              data.modifier_class += (data.modifier_class ? ' ' : '') + this.options.placeholder;
            }

            section.markup = template.render(this.safeMarkup(data));
            section.example = section.markup;

            let getExampleTemplate,
              templateContext;
            if (templateInfo.exampleName) {
              getExampleTemplate = this.Twig.twigAsync({
                ref: templateInfo.exampleName
              });
              templateContext = templateInfo.exampleContext;
            } else {
              getExampleTemplate = Promise.resolve(template);
              templateContext = templateInfo.context;
            }

            /* eslint-disable max-nested-callbacks */
            return getExampleTemplate.then(template => {
              if (templateInfo.exampleName) {
                let data = JSON.parse(JSON.stringify(templateContext));
                data.modifier_class = data.modifier_class || /* istanbul ignore next */ '';
                // istanbul ignore else
                if (section.modifiers.length !== 0 && this.options.placeholder) {
                  data.modifier_class += (data.modifier_class ? ' ' : /* istanbul ignore next */ '') + this.options.placeholder;
                }
                section.example = template.render(this.safeMarkup(data));
              }
              section.modifiers.forEach(modifier => {
                let data = JSON.parse(JSON.stringify(templateContext));
                data.modifier_class = (data.modifier_class ? data.modifier_class + ' ' : '') + modifier.className;
                modifier.markup = template.render(this.safeMarkup(data));
              });
              return Promise.resolve();
            });
            /* eslint-enable camelcase, max-nested-callbacks */
          });
        } else {
          return Promise.resolve();
        }
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
          this.templates[templateName].render(context)
        );
      });
    });
  }
}

module.exports = KssBuilderBaseTwig;
