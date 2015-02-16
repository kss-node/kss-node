// This optional file is used to load the KSS generator needed by this template.
//
// The filename should follow standard node.js require() conventions. See
// http://nodejs.org/api/modules.html#modules_folders_as_modules It should
// either be named index.js or have its name set in the "main" property of the
// template's package.json.

var KssHandlebarsGenerator = require('kss/generators/handlebarsGenerator');

// Tell kss-node which generator this template uses.
module.exports.generator = KssHandlebarsGenerator;
