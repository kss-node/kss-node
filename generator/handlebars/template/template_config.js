'use strict';

// This optional file is used to load the CLI options and KSS generator needed
// by this template.
//
// The filename should follow standard node.js require() conventions. See
// http://nodejs.org/api/modules.html#modules_folders_as_modules It should
// either be named index.js or have its name set in the "main" property of the
// template's package.json.

var kssHandlebarsTemplate;

module.exports = kssHandlebarsTemplate = {};

// Tell kss-node which generator this template uses.
try {
  // In order for a template to be "kss-node clone"-able, it must use the
  // require('kss/generator/path') syntax.
  kssHandlebarsTemplate.generator = require('kss/generator/handlebars');
} catch (e) {
  // The above require() line will always fail while testing a git clone of this
  // module because this code is not inside a "node_modules/kss" folder which
  // would allow node.js to find it with require('kss/anything'). So we catch
  // the error and use a relative path.
  kssHandlebarsTemplate.generator = require('../kss_handlebars_generator.js');
}

// Tell kss-node which Yargs-like options this template has.
// See https://github.com/bcoe/yargs/blob/master/README.md#optionskey-opt
kssHandlebarsTemplate.options = {
  'title': {
    group: 'Style guide:',
    string: true,
    multiple: false,
    describe: 'Title of the style guide',
    default: 'KSS Style Guide'
  }
};

// If this template wants to modify the KssStyleguide object before the HTML is
// generated, it can do so here. For example, doing special handling of "custom"
// properties. It can also take this opportunity for other tasks, like running
// Sass or Bower tasks.
kssHandlebarsTemplate.generator.prepare = function(styleguide, cb) {
  return cb(null, styleguide);
};
