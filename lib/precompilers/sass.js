var fs = require('fs'),
    sass = require('sass'),
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
 */
sassCompile.render = function (file, callback) {
  try {
    callback(null, sass.render("@import '" + file + "';"));
  } catch(e) {
    return callback(e)
  }
};
