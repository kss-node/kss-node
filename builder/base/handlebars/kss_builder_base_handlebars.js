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
  path = require('path'),
  Promise = require('bluebird');

const fs = Promise.promisifyAll(require('fs-extra'));

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
    // Returns a promise to load the data context given a template file path.
    options.loadContext = filepath => {
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
    options.getTemplate = name => {
      // We don't wrap the rendered template in "new handlebars.SafeString()"
      // since we want the ability to display it as a code sample with {{ }} and
      // as rendered HTML with {{{ }}}.
      return Promise.resolve(this.Handlebars.compile('{{> "' + name + '"}}'));
    };
    // Returns a promise to get a template's markup by name.
    options.getTemplateMarkup = name => {
      // We don't wrap the rendered template in "new handlebars.SafeString()"
      // since we want the ability to display it as a code sample with {{ }} and
      // as rendered HTML with {{{ }}}.
      return Promise.resolve(this.Handlebars.partials[name]);
    };
    // Renders a template and returns the markup.
    options.templateRender = (template, context) => {
      return template(context);
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
}

module.exports = KssBuilderBaseHandlebars;
