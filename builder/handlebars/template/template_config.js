'use strict';

// This optional file is used to load the CLI options and KSS builder needed
// by this template.
//
// The filename should follow standard node.js require() conventions. See
// http://nodejs.org/api/modules.html#modules_folders_as_modules It should
// either be named index.js or have its name set in the "main" property of the
// template's package.json.

const kssTemplateHandlebars = {};

// Tell kss-node which builder this template uses.
try {
  // In order for a template to be "kss-node clone"-able, it must use the
  // require('kss/builder/path') syntax.
  kssTemplateHandlebars.builder = require('kss/builder/handlebars');
} catch (e) {
  // The above require() line will always fail while testing a git clone of this
  // module because this code is not inside a "node_modules/kss" folder which
  // would allow node.js to find it with require('kss/anything'). So we catch
  // the error and use a relative path.
  kssTemplateHandlebars.builder = require('../kss_builder_handlebars.js');
}

// Tell kss-node which Yargs-like options this template has.
// See https://github.com/bcoe/yargs/blob/master/README.md#optionskey-opt
kssTemplateHandlebars.options = {
  title: {
    group: 'Style guide:',
    string: true,
    multiple: false,
    describe: 'Title of the style guide',
    default: 'KSS Style Guide'
  }
};

// If this template needs to do preparation work before the HTML style guide is
// built, the template can do its work inside the `prepare()` method. The
// template has access to the KssStyleGuide object (as the `styleGuide`
// parameter), an object containing the configuration settings for the requested
// build (as `this.config`), and the global Handlebars object (as
// `this.Handlebars`).
//
// The template could also take this opportunity to do tasks like special
// handling of "custom" properties or running Sass or Bower tasks.
kssTemplateHandlebars.builder.prepare = function(styleGuide) {

  // Load this template's extra Handlebars helpers.

  // Allow a template user to override the {{section [reference]}} helper with
  // the --helpers setting. Since a user's handlebars helpers are loaded first,
  // we need to check if this helper already exists.
  if (!this.Handlebars.helpers['section']) {
    /**
     * Returns a single section, found by its reference
     * @param  {String} reference The reference to search for.
     */
    this.Handlebars.registerHelper('section', function(reference, options) {
      let section = options.data.root.styleGuide.sections(reference);

      return section ? options.fn(section.toJSON()) : options.inverse('');
    });
  }

  // Allow a template user to override the {{eachSection [query]}} helper with
  // the --helpers setting.
  if (!this.Handlebars.helpers['eachSection']) {
    /**
     * Loop over a section query. If a number is supplied, will convert into a
     * query for all children and descendants of that reference.
     * @param  {Mixed} query The section query
     */
    this.Handlebars.registerHelper('eachSection', function(query, options) {
      let styleGuide = options.data.root.styleGuide;

      if (!query.match(/\bx\b|\*/g)) {
        query = query + '.*';
      }
      let sections = styleGuide.sections(query);
      if (!sections.length) {
        return options.inverse('');
      }

      let l = sections.length;
      let buffer = '';
      for (let i = 0; i < l; i += 1) {
        buffer += options.fn(sections[i].toJSON());
      }

      return buffer;
    });
  }

  return Promise.resolve(styleGuide);
};

module.exports = kssTemplateHandlebars;
