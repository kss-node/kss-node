'use strict';

/**
 * The `kss/builder/base` module loads the {@link KssBuilderBase} class.
 * ```
 * const KssBuilderBase = require('kss/builder/base');
 * ```
 * @module kss/builder/base
 */

/* ***************************************************************
   See kss_builder_base_example.js for how to implement a builder.
   *************************************************************** */

const marked = require('marked'),
  emoji = require('node-emoji'),
  path = require('path'),
  Promise = require('bluebird');

const fs = Promise.promisifyAll(require('fs-extra')),
  glob = Promise.promisify(require('glob')),
  kssBuilderAPI = '3.0';

/**
 * A kss-node builder takes input files and builds a style guide.
 */
class KssBuilderBase {

  /**
   * Create a KssBuilderBase object.
   *
   * This is the base object used by all kss-node builders.
   *
   * ```
   * const KssBuilderBase = require('kss/builder/base');
   * class KssBuilderCustom extends KssBuilderBase {
   *   // Override methods of KssBuilderBase.
   * }
   * ```
   */
  constructor() {
    this.optionDefinitions = {};
    this.options = {};

    // Store the version of the builder API that the builder instance is
    // expecting; we will verify this in loadBuilder().
    this.API = 'undefined';

    // The log function defaults to console.log.
    this.setLogFunction(console.log);

    // The error logging function defaults to console.error.
    this.setLogErrorFunction(console.error);

    // Tell kss-node which Yargs-like options this builder has.
    this.addOptionDefinitions({
      'source': {
        group: 'File locations:',
        string: true,
        path: true,
        describe: 'Source directory to recursively parse for KSS comments, homepage, and markup'
      },
      'destination': {
        group: 'File locations:',
        string: true,
        path: true,
        multiple: false,
        describe: 'Destination directory of style guide',
        default: 'styleguide'
      },
      'json': {
        group: 'File locations:',
        boolean: true,
        multiple: false,
        describe: 'Output a JSON object instead of building a style guide'
      },
      'mask': {
        group: 'File locations:',
        alias: 'm',
        string: true,
        multiple: false,
        describe: 'Use a mask for detecting files containing KSS comments',
        default: '*.css|*.less|*.sass|*.scss|*.styl|*.stylus'
      },

      'clone': {
        group: 'Builder:',
        string: true,
        path: true,
        multiple: false,
        describe: 'Clone a style guide builder to customize'
      },
      'builder': {
        group: 'Builder:',
        alias: 'b',
        string: true,
        path: true,
        multiple: false,
        describe: 'Use the specified builder when building your style guide',
        default: path.relative(process.cwd(), path.join(__dirname, '..', 'handlebars'))
      },
      'css': {
        group: 'Style guide:',
        string: true,
        describe: 'URL of a CSS file to include in the style guide'
      },
      'js': {
        group: 'Style guide:',
        string: true,
        describe: 'URL of a JavaScript file to include in the style guide'
      },
      'custom': {
        group: 'Style guide:',
        string: true,
        describe: 'Process a custom property name when parsing KSS comments'
      },
      'extend': {
        group: 'Style guide:',
        string: true,
        path: true,
        describe: 'Location of modules to extend the templating system; see http://bit.ly/kss-wiki'
      },
      'homepage': {
        group: 'Style guide:',
        string: true,
        multiple: false,
        describe: 'File name of the homepage\'s Markdown file',
        default: 'homepage.md'
      },
      'markup': {
        group: 'Style guide:',
        boolean: true,
        multiple: false,
        describe: 'Render "markup" templates to HTML with the placeholder text',
        default: false
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
      },
      'emoji': {
        group: 'Style guide:',
        boolean: true,
        multiple: false,
        describe: 'Add emoji support',
        default: true
      },
      'verbose': {
        count: true,
        multiple: false,
        describe: 'Display verbose details while building'
      }
    });
  }

  /**
   * Loads the builder from the given file path or class.
   *
   * Call this static method to load the builder and verify the builder
   * implements the correct builder API version.
   *
   * @param {string|function} builderClass The path to a builder or a builder
   *   class to load.
   * @returns {Promise.<KssBuilderBase>} A `Promise` object resolving to a
   *   `KssBuilderBase` object, or one of its sub-classes.
   */
  static loadBuilder(builderClass) {
    return new Promise((resolve, reject) => {
      let newBuilder = {},
        SomeBuilder,
        isCompatible = true,
        builderAPI = 'undefined';

      try {
        // The parameter can be a class or constructor function.
        if (typeof builderClass === 'function') {
          SomeBuilder = builderClass;

        // If the parameter is a path, try to load the module.
        } else if (typeof builderClass === 'string') {
          SomeBuilder = require(path.resolve(builderClass));

        // Unexpected parameter.
        } else {
          return reject(new Error('Unexpected value for "builder"; should be a path to a module or a JavaScript Class.'));
        }

        // Check for a kss-node 2.0 template and KssGenerator. Template's were
        // objects that provided the builder (generator) as a property.
        if (typeof SomeBuilder === 'object'
          && SomeBuilder.hasOwnProperty('generator')
          && SomeBuilder.generator.hasOwnProperty('implementsAPI')) {
          isCompatible = false;
          builderAPI = SomeBuilder.generator.implementsAPI;

        // Try to create a new builder.
        } else {
          newBuilder = new SomeBuilder();
        }

      } catch (e) {
        // Builders don't have to export their own builder class. If the builder
        // fails to export a builder class, we assume it wanted the default
        // builder. If the loader fails when given a string, we check if the
        // caller (either cli.js or kss.js) wanted the Twig builder and let the
        // caller recover from the thrown error.
        const supportedBuilders = [
          'builder/twig',
          'builder/nunjucks'
        ];
        // istanbul ignore if
        if (supportedBuilders.indexOf(builderClass) > -1) {
          return reject(new Error(`The specified builder, "${builderClass}", is not relative to the current working directory.`));
        } else {
          let KssBuilderHandlebars = require('../handlebars');
          newBuilder = new KssBuilderHandlebars();
        }
      }

      // Grab the builder API version.
      if (newBuilder.hasOwnProperty('API')) {
        builderAPI = newBuilder.API;
      }

      // Ensure KssBuilderBase is the base class.
      if (!(newBuilder instanceof KssBuilderBase)) {
        isCompatible = false;
      } else if (builderAPI.indexOf('.') === -1) {
        isCompatible = false;
      } else {
        let version = kssBuilderAPI.split('.');
        let apiMajor = parseInt(version[0]);
        let apiMinor = parseInt(version[1]);

        version = builderAPI.split('.');
        let builderMajor = parseInt(version[0]);
        let builderMinor = parseInt(version[1]);

        if (builderMajor !== apiMajor || builderMinor > apiMinor) {
          isCompatible = false;
        }
      }

      if (!isCompatible) {
        return reject(new Error('kss expected the builder to implement KssBuilderBase API version ' + kssBuilderAPI + '; version "' + builderAPI + '" is being used instead.'));
      }

      return resolve(newBuilder);
    });
  }

  /**
   * Stores the given options.
   *
   * @param {Object} options An object of options to store.
   * @returns {KssBuilderBase} The `KssBuilderBase` object is returned to allow
   *   chaining of methods.
   */
  addOptions(options) {
    for (let key in options) {
      if (options.hasOwnProperty(key) && ['logFunction', 'logErrorFunction'].indexOf(key) === -1) {
        this.options[key] = options[key];
      }
    }

    // Set the logging functions of the builder.
    if (typeof options.logFunction === 'function') {
      this.setLogFunction(options.logFunction);
    }
    if (typeof options.logErrorFunction === 'function') {
      this.setLogErrorFunction(options.logErrorFunction);
    }

    // Allow clone to be used without a path. We can't specify this default path
    // in the option definition or the clone flag would always be "on".
    if (options.clone === '' || options.clone === true) {
      this.options.clone = 'custom-builder';
    }

    // Allow chaining.
    return this.normalizeOptions(Object.keys(options));
  }

  /**
   * Returns the requested option or, if no key is specified, an object
   * containing all options.
   *
   * @param {string} [key] Optional name of the option to return.
   * @returns {*} The specified option or an object of all options.
   */
  getOptions(key) {
    return key ? this.options[key] : this.options;
  }

  /**
   * Adds option definitions to the builder.
   *
   * Since kss-node is extensible, builders can define their own options that
   * users can configure.
   *
   * Each option definition object is key-compatble with
   * [yargs](https://www.npmjs.com/package/yargs), the command-line utility
   * used by kss-node's command line tool.
   *
   * If an option definition object has a:
   * - `multiple` property: if set to `false`, the corresponding option will be
   *   normalized to a single value. Otherwise, it will be normalized to an
   *   array of values.
   * - `path` property: if set to `true`, the corresponding option will be
   *   normalized to a path, relative to the current working directory.
   * - `default` property: the corresponding option will default to this value.
   *
   * @param {object} optionDefinitions An object of option definitions.
   * @returns {KssBuilderBase} The `KssBuilderBase` object is returned to allow
   *   chaining of methods.
   */
  addOptionDefinitions(optionDefinitions) {
    for (let key in optionDefinitions) {
      // istanbul ignore else
      if (optionDefinitions.hasOwnProperty(key)) {
        // The "multiple" property defaults to true.
        if (typeof optionDefinitions[key].multiple === 'undefined') {
          optionDefinitions[key].multiple = true;
        }
        // The "path" property defaults to false.
        if (typeof optionDefinitions[key].path === 'undefined') {
          optionDefinitions[key].path = false;
        }
        this.optionDefinitions[key] = optionDefinitions[key];
      }
    }

    // Allow chaining.
    return this.normalizeOptions(Object.keys(optionDefinitions));
  }

  /**
   * Returns the requested option definition or, if no key is specified, an
   * object containing all option definitions.
   *
   * @param {string} [key] Optional name of option to return.
   * @returns {*} The specified option definition or an object of all option
   *   definitions.
   */
  getOptionDefinitions(key) {
    return key ? this.optionDefinitions[key] : this.optionDefinitions;
  }

  /**
   * Normalizes the options so that they are easy to use inside KSS.
   *
   * The option definitions specified with `addOptionDefinitions()` determine
   * how the options will be normalized.
   *
   * @private
   * @param {string[]} keys The keys to normalize.
   * @returns {KssBuilderBase} The `KssBuilderBase` object is returned to allow
   *   chaining of methods.
   */
  normalizeOptions(keys) {
    for (let key of keys) {
      if (typeof this.optionDefinitions[key] !== 'undefined') {
        if (typeof this.options[key] === 'undefined') {
          // Set the default setting.
          if (typeof this.optionDefinitions[key].default !== 'undefined') {
            this.options[key] = this.optionDefinitions[key].default;
          }
        }
        // If an option is specified multiple times, yargs will convert it into
        // an array, but leave it as a string otherwise. This makes accessing
        // the options inconsistent, so we make these options an array.
        if (this.optionDefinitions[key].multiple) {
          if (!(this.options[key] instanceof Array)) {
            if (typeof this.options[key] === 'undefined') {
              this.options[key] = [];
            } else {
              this.options[key] = [this.options[key]];
            }
          }
        } else {
          // For options marked as "multiple: false", use the last value
          // specified, ignoring the others.
          if (this.options[key] instanceof Array) {
            this.options[key] = this.options[key].pop();
          }
        }
        // Resolve any paths relative to the working directory.
        if (this.optionDefinitions[key].path) {
          if (this.options[key] instanceof Array) {
            /* eslint-disable no-loop-func */
            this.options[key] = this.options[key].map(value => {
              return path.resolve(value);
            });
            /* eslint-enable no-loop-func */
          } else if (typeof this.options[key] === 'string') {
            this.options[key] = path.resolve(this.options[key]);
          }
        }
      }
    }

    // Allow chaining.
    return this;
  }

  /* eslint-disable no-unused-vars */
  /**
   * Logs a message to be reported to the user.
   *
   * Since a builder can be used in places other than the console, using
   * console.log() is inappropriate. The log() method should be used to pass
   * messages to the KSS system so it can report them to the user.
   *
   * @param {...string} message The message to log.
   * @returns {KssBuilderBase} The `KssBuilderBase` object is returned to allow
   *   chaining of methods.
   */
  log(message) {
    /* eslint-enable no-unused-vars */
    this.logFunction.apply(null, arguments);

    // Allow chaining.
    return this;
  }

  /**
   * The `log()` method logs a message for the user. This method allows the
   * system to define the underlying function used by the log method to report
   * the message to the user. The default log function is a wrapper around
   * `console.log()`.
   *
   * @param {Function} logFunction Function to log a message to the user.
   * @returns {KssBuilderBase} The `KssBuilderBase` object is returned to allow
   *   chaining of methods.
   */
  setLogFunction(logFunction) {
    this.logFunction = logFunction;

    // Allow chaining.
    return this;
  }

  /* eslint-disable no-unused-vars */
  /**
   * Logs an error to be reported to the user.
   *
   * Since a builder can be used in places other than the console, using
   * console.error() is inappropriate. The logError() method should be used to
   * pass error messages to the KSS system so it can report them to the user.
   *
   * @param {Error} error The error to log.
   * @returns {KssBuilderBase} The `KssBuilderBase` object is returned to allow
   *   chaining of methods.
   */
  logError(error) {
    /* eslint-enable no-unused-vars */
    this.logErrorFunction.apply(null, arguments);

    // Allow chaining.
    return this;
  }

  /**
   * The `error()` method logs an error message for the user. This method allows
   * the system to define the underlying function used by the error method to
   * report the error message to the user. The default log error function is a
   * wrapper around `console.error()`.
   *
   * @param {Function} logErrorFunction Function to log a message to the user.
   * @returns {KssBuilderBase} The `KssBuilderBase` object is returned to allow
   *   chaining of methods.
   */
  setLogErrorFunction(logErrorFunction) {
    this.logErrorFunction = logErrorFunction;

    // Allow chaining.
    return this;
  }

  /**
   * Clone a builder's files.
   *
   * This method is fairly simple; it copies one directory to the specified
   * location. A sub-class of KssBuilderBase does not need to override this
   * method, but it can if it needs to do something more complicated.
   *
   * @param {string} builderPath Path to the builder to clone.
   * @param {string} destinationPath Path to the destination of the newly cloned
   *   builder.
   * @returns {Promise.<null>} A `Promise` object resolving to `null`.
   */
  clone(builderPath, destinationPath) {
    return fs.statAsync(destinationPath).catch(error => {
      // Pass the error on to the next .then().
      return error;
    }).then(result => {
      // If we successfully get stats, the destination exists.
      if (!(result instanceof Error)) {
        return Promise.reject(new Error('This folder already exists: ' + destinationPath));
      }

      // If the destination path does not exist, we copy the builder to it.
      // istanbul ignore else
      if (result.code === 'ENOENT') {
        return fs.copyAsync(
          builderPath,
          destinationPath,
          {
            clobber: true,
            filter: filePath => {
              // Only look at the part of the path inside the builder.
              let relativePath = path.sep + path.relative(builderPath, filePath);
              // Skip any files with a path matching: /node_modules or /.
              return (new RegExp('^(?!.*\\' + path.sep + '(node_modules$|\\.))')).test(relativePath);
            }
          }
        );
      } else {
        // Otherwise, report the error.
        return Promise.reject(result);
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
   * @returns {Promise.<KssStyleGuide>} A `Promise` object resolving to a
   *   `KssStyleGuide` object.
   */
  prepare(styleGuide) {
    let sectionReferences,
      newSections = [],
      delim = styleGuide.referenceDelimiter();

    // Create a list of references in the style guide.
    sectionReferences = styleGuide.sections().map(section => {
      return section.reference();
    });

    // Return an error if no KSS sections are found.
    if (sectionReferences.length === 0) {
      return Promise.reject(new Error('No KSS documentation discovered in source files.'));
    }

    sectionReferences.forEach(reference => {
      let refParts = reference.split(delim),
        checkReference = '';
      // Split the reference into parts and ensure there are existing sections
      // for each level of the reference. e.g. For "a.b.c", check for existing
      // sections for "a" and "a.b".
      for (let i = 0; i < refParts.length - 1; i++) {
        checkReference += (checkReference ? delim : '') + refParts[i];
        if (sectionReferences.indexOf(checkReference) === -1 && newSections.indexOf(checkReference) === -1) {
          newSections.push(checkReference);
          // Add the missing section to the style guide.
          styleGuide
            .autoInit(false)
            .sections({
              header: checkReference,
              reference: checkReference
            });
        }
      }
    });

    // Re-init the style guide if we added new sections.
    if (newSections.length) {
      styleGuide.autoInit(true);
    }

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
    }

    return Promise.resolve(styleGuide);
  }

  /**
   * A helper method that initializes the destination directory and optionally
   * copies the given asset directory from the builder.
   *
   * @param {string} assetDirectory The name of the asset directory to copy from
   *   builder.
   * @returns {Promise} A promise to initialize the destination directory.
   */
  prepareDestination(assetDirectory) {
    // Create a new destination directory.
    return fs.mkdirsAsync(this.options.destination).then(() => {
      if (assetDirectory) {
        // Optionally, copy the contents of the builder's asset directory.
        return fs.copyAsync(
          path.join(this.options.builder, assetDirectory),
          path.join(this.options.destination, assetDirectory),
          {
            clobber: true,
            filter: filePath => {
              // Only look at the part of the path inside the builder.
              let relativePath = path.sep + path.relative(this.options.builder, filePath);
              // Skip any files with a path matching: "/node_modules" or "/."
              return (new RegExp('^(?!.*\\' + path.sep + '(node_modules$|\\.))')).test(relativePath);
            }
          }
        ).catch(() => {
          // If the builder does not have a kss-assets folder, ignore the error.
          return Promise.resolve();
        });
      } else {
        return Promise.resolve();
      }
    });
  }

  /**
   * Helper method that loads modules to extend a templating system.
   *
   * The `--extend` option allows users to specify directories. This helper
   * method requires all .js files in the specified directories and calls the
   * default function exported with two parameters, the `templateEngine` object
   * and the options added to the builder.
   *
   * @param {object} templateEngine The templating system's main object; used by
   *   the loaded module to extend the templating system.
   * @returns {Array.<Promise>} An array of `Promise` objects; one for each directory
   *   given to the extend option.
   */
  prepareExtend(templateEngine) {
    let promises = [];
    this.options.extend.forEach(directory => {
      promises.push(
        fs.readdirAsync(directory).then(files => {
          files.forEach(fileName => {
            if (path.extname(fileName) === '.js') {
              let extendFunction = require(path.join(directory, fileName));
              if (typeof extendFunction === 'function') {
                extendFunction(templateEngine, this.options);
              }
            }
          });
        }).catch((error) => {
          // Log the error, but allow operation to continue.
          if (this.options.verbose) {
            this.logError(new Error('An error occurred when attempting to use the "extend" directory, ' + directory + ': ' + error.message));
          }
          return Promise.resolve();
        })
      );
    });
    return promises;
  }

  /**
   * Build the HTML files of the style guide given a KssStyleGuide object.
   *
   * @param {KssStyleGuide} styleGuide The KSS style guide in object format.
   * @returns {Promise.<KssStyleGuide>} A `Promise` object resolving to a
   *   `KssStyleGuide` object.
   */
  build(styleGuide) {
    return Promise.resolve(styleGuide);
  }

  /**
   * A helper method that can be used by sub-classes of KssBuilderBase when
   * implementing their build() method.
   *
   * The following options are required to use this helper method:
   * - readBuilderTemplate: A function that returns a promise to read/load a
   *   template provided by the builder.
   * - readSectionTemplate: A function that returns a promise to read/load a
   *   template specified by a section.
   * - loadInlineTemplate: A function that returns a promise to load an inline
   *   template from markup.
   * - loadContext: A function that returns a promise to load the data context
   *   given a template file path.
   * - getTemplate: A function that returns a promise to get a template by name.
   * - templateRender: A function that renders a template and returns the
   *   markup.
   * - filenameToTemplateRef: A function that converts a filename into a unique
   *   name used by the templating system.
   * - templateExtension: A string containing the file extension used by the
   *   templates.
   * - emptyTemplate: A string containing markup for an empty template.
   *
   * @param {KssStyleGuide} styleGuide The KSS style guide in object format.
   * @param {object} options The options necessary to use this helper method.
   * @returns {Promise.<KssStyleGuide>} A `Promise` object resolving to a
   *   `KssStyleGuide` object.
   */
  buildGuide(styleGuide, options) {
    let readBuilderTemplate = options.readBuilderTemplate,
      readSectionTemplate = options.readSectionTemplate,
      loadInlineTemplate = options.loadInlineTemplate,
      loadContext = options.loadContext,
      // getTemplate = options.getTemplate,
      // templateRender = options.templateRender,
      filenameToTemplateRef = options.filenameToTemplateRef,
      templateExtension = options.templateExtension,
      emptyTemplate = options.emptyTemplate;

    this.styleGuide = styleGuide;
    this.sectionTemplates = {};

    if (typeof this.templates === 'undefined') {
      this.templates = {};
    }

    let buildTasks = [],
      readBuilderTask;

    // Optionally load/compile the index template.
    if (typeof this.templates.index === 'undefined') {
      readBuilderTask = readBuilderTemplate('index').then(template => {
        this.templates.index = template;
        return Promise.resolve();
      });
    } else {
      readBuilderTask = Promise.resolve();
    }

    // Optionally load/compile the section template.
    if (typeof this.templates.section === 'undefined') {
      readBuilderTask = readBuilderTask.then(() => {
        return readBuilderTemplate('section').then(template => {
          this.templates.section = template;
          return Promise.resolve();
        }).catch(() => {
          // If the section template cannot be read, use the index template.
          this.templates.section = this.templates.index;
          return Promise.resolve();
        });
      });
    }

    // Optionally load/compile the item template.
    if (typeof this.templates.item === 'undefined') {
      readBuilderTask = readBuilderTask.then(() => {
        return readBuilderTemplate('item').then(template => {
          this.templates.item = template;
          return Promise.resolve();
        }).catch(() => {
          // If the item template cannot be read, use the section template.
          this.templates.item = this.templates.section;
          return Promise.resolve();
        });
      });
    }
    buildTasks.push(readBuilderTask);

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

    // Save the name of the template and its context for retrieval in
    // buildPage(), where we only know the reference.
    let saveTemplate = template => {
      this.sectionTemplates[template.reference] = {
        name: template.name,
        context: template.context,
        filename: template.file,
        exampleName: template.exampleName,
        exampleContext: template.exampleContext
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

      // Register all the markup blocks as templates.
      let template = {
        name: section.reference(),
        reference: section.reference(),
        file: '',
        markup: section.markup(),
        context: {},
        exampleName: false,
        exampleContext: {}
      };

      // Check if the markup is a file path.
      if (template.markup.search('^[^\n]+\.(html|' + templateExtension + ')$') === -1) {
        if (this.options.verbose) {
          this.log(' - ' + template.reference + ': inline markup');
        }
        buildTasks.push(
          loadInlineTemplate(template.name, template.markup).then(() => {
            return saveTemplate(template);
          })
        );
      } else {
        // Attempt to load the file path.
        section.custom('markupFile', template.markup);
        template.file = template.markup;
        template.name = filenameToTemplateRef(template.file);

        let findTemplates = [],
          matchFilename = path.basename(template.file),
          matchExampleFilename = 'kss-example-' + matchFilename;
        this.options.source.forEach(source => {
          let returnFilesAndSource = function(files) {
            return {
              source: source,
              files: files
            };
          };
          findTemplates.push(glob(source + '/**/' + template.file).then(returnFilesAndSource));
          findTemplates.push(glob(source + '/**/' + path.join(path.dirname(template.file), matchExampleFilename)).then(returnFilesAndSource));
        });
        buildTasks.push(
          Promise.all(findTemplates).then(globMatches => {
            let foundTemplate = false,
              foundExample = false,
              loadTemplates = [];
            for (let globMatch of globMatches) {
              let files = globMatch.files,
                source = globMatch.source;
              if (!foundTemplate || !foundExample) {
                for (let file of files) {
                  // Read the template from the first matched path.
                  let filename = path.basename(file);
                  if (!foundTemplate && filename === matchFilename) {
                    foundTemplate = true;
                    section.custom('markupFile', path.relative(source, file));
                    template.file = file;
                    loadTemplates.push(
                      readSectionTemplate(template.name, file).then(() => {
                        /* eslint-disable max-nested-callbacks */
                        return loadContext(file).then(context => {
                          template.context = context;
                          return Promise.resolve();
                        });
                        /* eslint-enable max-nested-callbacks */
                      })
                    );
                  } else if (!foundExample && filename === matchExampleFilename) {
                    foundExample = true;
                    template.exampleName = 'kss-example-' + template.name;
                    loadTemplates.push(
                      readSectionTemplate(template.exampleName, file).then(() => {
                        /* eslint-disable max-nested-callbacks */
                        return loadContext(file).then(context => {
                          template.exampleContext = context;
                          return Promise.resolve();
                        });
                        /* eslint-enable max-nested-callbacks */
                      })
                    );
                  }
                }
              }
            }

            // If the markup file is not found, note that in the style guide.
            if (!foundTemplate && !foundExample) {
              template.markup += ' NOT FOUND!';
              if (!this.options.verbose) {
                this.log('WARNING: In section ' + template.reference + ', ' + template.markup);
              }
              loadTemplates.push(
                loadInlineTemplate(template.name, template.markup)
              );
            } else if (!foundTemplate) {
              // If we found an example, but no template, load an empty
              // template.
              loadTemplates.push(
                loadInlineTemplate(template.name, emptyTemplate)
              );
            }

            if (this.options.verbose) {
              this.log(' - ' + template.reference + ': ' + template.markup);
            }

            return Promise.all(loadTemplates).then(() => {
              return template;
            });
          }).then(saveTemplate)
        );
      }
    });

    return Promise.all(buildTasks).then(() => {
      if (this.options.verbose) {
        this.log('...Building style guide pages:');
      }

      let buildPageTasks = [];

      // Build the homepage.
      buildPageTasks.push(this.buildPage('index', options, null, []));

      // Group all of the sections by their root reference, and make a page for
      // each.
      sectionRoots.forEach(rootReference => {
        buildPageTasks.push(this.buildPage('section', options, rootReference, this.styleGuide.sections(rootReference + '.*')));
      });

      // For each section, build a page which only has a single section on it.
      // istanbul ignore else
      if (this.templates.item) {
        sections.forEach(section => {
          buildPageTasks.push(this.buildPage('item', options, section.reference(), [section]));
        });
      }

      return Promise.all(buildPageTasks);
    }).then(() => {
      // We return the KssStyleGuide, just like KssBuilderBase.build() does.
      return Promise.resolve(styleGuide);
    });
  }

  /**
   * Renders the template for a section and saves it to a file.
   *
   * @param {string} templateName The name of the template to use.
   * @param {object} options The `getTemplate` and `templateRender` options
   *   necessary to use this helper method; should be the same as the options
   *   passed to BuildGuide().
   * @param {string|null} pageReference The reference of the current page's root
   *   section, or null if the current page is the homepage.
   * @param {Array} sections An array of KssSection objects.
   * @param {Object} [context] Additional context to give to the template when
   *   it is rendered.
   * @returns {Promise} A `Promise` object.
   */
  buildPage(templateName, options, pageReference, sections, context) {
    let getTemplate = options.getTemplate,
      getTemplateMarkup = options.getTemplateMarkup,
      templateRender = options.templateRender;

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
    context.options = this.options;

    // Performs a shallow clone of the context clone so that the modifier_class
    // property can be modified without affecting the original value.
    let contextClone = data => {
      let clone = {};
      for (var prop in data) {
        // istanbul ignore else
        if (data.hasOwnProperty(prop)) {
          clone[prop] = data[prop];
        }
      }
      return clone;
    };

    // Render the template for each section markup and modifier.
    return Promise.all(
      context.sections.map(section => {
        // If the section does not have any markup, render an empty string.
        if (!section.markup) {
          return Promise.resolve();
        } else {
          // Load the information about this section's markup template.
          let templateInfo = this.sectionTemplates[section.reference];
          let markupTask,
            exampleTask = false,
            exampleContext,
            modifierRender = (template, data, modifierClass) => {
              data = contextClone(data);
              /* eslint-disable camelcase */
              data.modifier_class = (data.modifier_class ? data.modifier_class + ' ' : '') + modifierClass;
              /* eslint-enable camelcase */
              return templateRender(template, data);
            };

          // Set the section's markup variable. It's either the template's raw
          // markup or the rendered template.
          if (!this.options.markup && path.extname(templateInfo.filename) === '.' + options.templateExtension) {
            markupTask = getTemplateMarkup(templateInfo.name).then(markup => {
              // Copy the template's raw (unrendered) markup.
              section.markup = markup;
            });
          } else {
            // Temporarily set it to "true" until we create a proper Promise.
            exampleTask = !(templateInfo.exampleName);
            markupTask = getTemplate(templateInfo.name).then(template => {
              section.markup = modifierRender(
                template,
                templateInfo.context,
                // Display the placeholder if the section has modifiers.
                (section.modifiers.length !== 0 ? this.options.placeholder : '')
              );

              // If this section doesn't have a "kss-example" template, we will
              // be re-using this template for the rendered examples.
              if (!templateInfo.exampleName) {
                exampleTask = Promise.resolve(template);
              }
            });
          }

          // Pick a template to use for the rendered example variable.
          if (templateInfo.exampleName) {
            exampleTask = getTemplate(templateInfo.exampleName);
            exampleContext = templateInfo.exampleContext;
          } else {
            if (!exampleTask) {
              exampleTask = getTemplate(templateInfo.name);
            }
            exampleContext = templateInfo.context;
          }

          // Render the example variable and each modifier's markup.
          return markupTask.then(() => {
            return exampleTask;
          }).then(template => {
            section.example = templateRender(template, contextClone(exampleContext));

            section.modifiers.forEach(modifier => {
              modifier.markup = modifierRender(
                template,
                exampleContext,
                modifier.className
              );
            });
            return Promise.resolve();
          });
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
          if (this.options.emoji) {
            context.homepage = emoji.emojify(context.homepage);
          }
          return Promise.resolve();
        });
      }

      return getHomepageText.then(() => {
        // Render the template and save it to the destination.
        return fs.writeFileAsync(
          path.join(this.options.destination, fileName),
          templateRender(this.templates[templateName], context)
        );
      });
    });
  }

  /**
   * Creates a 2-level hierarchical menu from the style guide.
   *
   * @param {string} pageReference The reference of the root section of the page
   *   being built.
   * @returns {Array} An array of menu items that can be used as a template
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
      delete menuItem.source;

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
      menuItem.children = menuItem.children.filter(item => {
        return item.depth <= this.options['nav-depth'];
      }, this);

      return menuItem;
    });
  }
}

module.exports = KssBuilderBase;
