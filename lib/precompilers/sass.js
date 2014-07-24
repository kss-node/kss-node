var fs = require('fs'),
    sass = require('node-sass'),
    sassCompile = module.exports = {};

// Name of the stylesheet language
sassCompile.name = 'sass';

// File extension for that language
sassCompile.extensions = ['sass'];

/**
 * Compiles the passed file to css and passes
 * the resulting css to the given callback
 *
 * @param  {String}   file     The file to compile
 * @param  {Function} callback (err, css)
 * @param  {Object}   options  Options from the command line
 */
sassCompile.render = function (file, callback, options) {
  var sassOptions = {file: file};

  try {
    if (options.loadPath) {
      sassOptions.includePaths = options.loadPath;
    }
    callback(null, sass.renderSync(sassOptions));
  } catch(e) {
    return callback(e);
  }
};
