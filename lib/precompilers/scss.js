var fs = require('fs'),
    scss = require('sass-wrapper'),
    scssCompile = module.exports = {};

// Name of the stylesheet language
scssCompile.name = 'scss';

// File extension for that language
scssCompile.extensions = ['scss'];

/**
 * Compiles the passed file to css and passes
 * the resulting css to the given callback
 *
 * @param  {String}   file     The file to compile
 * @param  {Function} callback (err, css)
 */
scssCompile.render = function (file, callback) {
  scss.compile({
    filepath: file,
    callback: callback,
    compass: true
  });
};
