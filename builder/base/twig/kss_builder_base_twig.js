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
  path = require('path'),
  Promise = require('bluebird'),
  Twig = require('twig');

const fs = Promise.promisifyAll(require('fs-extra'));

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
      'extend-drupal8': {
        group: 'Style guide:',
        boolean: true,
        default: false,
        multiple: false,
        describe: 'Extend Twig.js using kss’s Drupal 8 extensions'
      },
      'extend-custom': {
        group: 'Style guide:',
        string: true,
        describe: 'Extend Twig.js using kss\'s Drupal 8 extensions'
      },
      'namespace': {
        group: 'Style guide:',
        string: true,
        describe: 'Adds a Twig namespace, given the formatted string: "namespace:path"'
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
        builderTwig: this.options.builder
      };
      this.options.namespace.forEach(namespace => {
        // namespace should be of the form "namespace:path";
        const namespacePart = namespace.substr(0, namespace.indexOf(':'));
        const pathPart = namespace.substr(namespace.indexOf(':') + 1);
        if (pathPart) {
          this.namespaces[namespacePart] = path.resolve(pathPart);
        }
      });

      if (this.options.verbose) {
        if (this.options.namespace.length) {
          this.log(' * Namespace   : ' + this.options.namespace.join(', '));
        }
        this.log('');
      }

      // Store the global Twig object.
      this.Twig = Twig;

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
          options.autoescape = false;
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
            fs.readFile(options.path, 'utf8', (err, data) => {
              if (err) {
                reject(new Error('Unable to find template file ' + options.path));
                return;
              }
              // Call twig() with our load/error callbacks.
              options.load = template => {
                // Store the raw markup in the template.
                template.rawMarkup = data;
                resolve(template);
              };
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

      // Load custom modules that extend Twig.
      if (this.options['extend-custom']) {
        this.options.extend.unshift(this.options['extend-custom']);
      }

      prepTasks.push(this.prepareExtend(this.Twig));

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
    // Returns a promise to load the data context given a template file path.
    options.loadContext = filepath => {
      let context;
      // Load sample context for the template from the sample .json file.
      try {
        context = require(path.join(path.dirname(filepath), path.basename(filepath, path.extname(filepath)) + '.json'));
        // require() returns a cached object. We want an independent clone of
        // the object so we can make changes without affecting the original.
        context = JSON.parse(JSON.stringify(context));
        context = this.safeMarkup(context);
      } catch (error) {
        context = {};
      }
      return Promise.resolve(context);
    };
    // Returns a promise to get a template by name.
    options.getTemplate = name => {
      return this.Twig.twigAsync({
        ref: name
      });
    };
    // Returns a promise to get a template's markup by name.
    options.getTemplateMarkup = name => {
      return options.getTemplate(name).then(template => {
        // The rawMarkup is a custom property set in twigAsync().
        return template.rawMarkup;
      });
    };
    // Renders a template and returns the markup.
    options.templateRender = (template, context) => {
      return template.render(context);
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
}

module.exports = KssBuilderBaseTwig;
