'use strict';

/**
 * The `kss/builder/base/nunjucks` module loads the KssBuilderBaseNunjucks
 * class, a `{@link KssBuilderBase}` sub-class using no templating.
 * ```
 * const KssBuilderBaseNunjucks = require('kss/builder/base/nunjucks');
 * ```
 * @module kss/builder/base/nunjucks
 */

// Import the KssBuilderBase class. We will extend it to scaffold our builder.
// Note: Since you will be building a sub-class outside of the kss module, this
// next line will be: const KssBuilderBase = require('kss/builder/base');
const KssBuilderBase = require('../kss_builder_base.js');
const path = require('path');
const nunjucks = require('nunjucks');
const Promise = require('bluebird');

const fs = Promise.promisifyAll(require('fs-extra'));

// Define "KssBuilderBaseNunjucks" as the name of our nunjucks builder class.
//
// Our builder is a sub-class of the KssBuilderBase class with additional
// functionality added by overriding the parent methods.
class KssBuilderBaseNunjucks extends KssBuilderBase {
  /**
   * Create a KssBuilderBaseNunjucks object.
   *
   * ```
   * const KssBuilderBaseNunjucks = require('kss/builder/base/nunjucks');
   * const builder = new KssBuilderBaseNunjucks();
   * ```
   */
  constructor() {
    super();

    // Store the version of the builder API that the builder instance is
    // expecting; we will verify this in loadBuilder().
    this.API = '3.0';

    // Allow the use of other file extensions
    // @see: https://mozilla.github.io/nunjucks/templating.html#file-extensions
    this.addOptionDefinitions({
      extension: {
        multiple: false,
        describe: 'The preferred Nunjucks extension',
        group: 'Style guide:',
        default: 'njk'
      }
    });
  }

  /**
   * Allow the builder to preform pre-build tasks or modify the KssStyleGuide
   * object.
   *
   * The method can be set by any KssBuilderBase sub-class to do any custom tasks
   * after the KssStyleGuide object is created and before the HTML style guide
   * is built.
   *
   * @param {KssStyleGuide} styleGuide The KSS style guide in object format.
   * @returns {Promise.<KssStyleGuide>} A `Promise` object resolving to
   *   `styleGuide`.
   */
  prepare(styleGuide) {
    // First we let KssBuilderBase.prepare() clean-up the style guide object.
    return super.prepare(styleGuide).then((styleGuide) => {
      // Then we do our own prep work inside this Promise's .then() method.
      this.Nunjucks = nunjucks;
      this.Nunjucks.installJinjaCompat();
      this.NunjucksEnv = this.Nunjucks.configure({
        autoescape: false
      });

      const prepTasks = [];
      // Create a new destination directory.
      prepTasks.push(this.prepareDestination('kss-assets'));
      // Load modules that extend Nunjucks.
      prepTasks.push(this.prepareExtend(this.NunjucksEnv));

      return Promise.all(prepTasks).then(() => {
        return Promise.resolve(styleGuide);
      });
    });
  }

  /**
   * Build the HTML files of the style guide given a KssStyleGuide object.
   *
   * @param {KssStyleGuide} styleGuide The KSS style guide in object format.
   * @returns {Promise} A `Promise` object.
   */
  build(styleGuide) {
    const options = {};
    options.templateExtension = this.options.extension;
    options.emptyTemplate = '{# Cannot be an empty string. #}';
    this.templates = {};

    // Returns a promise to read/load a template provided by the builder.
    options.readBuilderTemplate = (name) => {
      const templateName = `${name}.${options.templateExtension}`;
      const templatePath = path.resolve(this.options.builder, templateName);

      return fs.readFileAsync(templatePath, 'utf8').then((content) => {
        return this.Nunjucks.compile(content, this.NunjucksEnv);
      });
    };

    // Returns a promise to read/load a template specified by a section.
    options.readSectionTemplate = (name, filepath) => {
      return fs.readFileAsync(filepath, 'utf8').then((contents) => {
        const compiled = this.Nunjucks.compile(contents, this.NunjucksEnv);
        this.templates[name] = compiled;

        return compiled;
      });
    };

    // Returns a promise to load an inline template from markup.
    options.loadInlineTemplate = (name, markup) => {
      const compiled = this.Nunjucks.compile(markup, this.NunjucksEnv);
      this.templates[name] = compiled;

      return Promise.resolve(compiled);
    };

    // Returns a promise to load the data context given a template file path.
    options.loadContext = (filepath) => {
      let context;
      // Load sample context for the template from the sample .json file.
      try {
        context = require(path.join(path.dirname(filepath), path.basename(filepath, path.extname(filepath)) + '.json'));
        // require() returns a cached object. We want an independent clone of
        // the object so we can make changes without affecting the original.
        context = JSON.parse(JSON.stringify(context));
      } catch (error) {
        context = {};
      }

      return Promise.resolve(context);
    };

    // Returns a promise to get a template by name.
    options.getTemplate = (name) => {
      return Promise.resolve(this.templates[name]);
    };

    // Returns a promise to get a template's markup by name.
    options.getTemplateMarkup = (name) => {
      return options.getTemplate(name).then((template) => {
        return template.tmplStr;
      });
    };

    // Renders a template and returns the markup.
    options.templateRender = (template, context) => {
      try {
        return this.Nunjucks.render(template, context);
      } catch (e) {
        // istanbul ignore next
        return '';
      }
    };

    // Converts a filename into a Handlebars partial name.
    options.filenameToTemplateRef = (filename) => {
      // Return the filename without the full path or the file extension.
      return path.basename(filename, path.extname(filename));
    };

    return this.buildGuide(styleGuide, options);
  }
}

// Export our "KssBuilderBaseNunjucks" class.
module.exports = KssBuilderBaseNunjucks;
