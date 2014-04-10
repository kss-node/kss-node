var fs = require('fs'),
		stylus = require('stylus'),
		stylusCompile = module.exports = {};

// Name of the stylesheet language
stylusCompile.name = 'stylus';

// File extension for that language
stylusCompile.extensions = ['styl', 'stylus'];

/**
 * Compiles the passed file to css and passes
 * the resulting css to the given callback
 *
 * @param  {String}   file     The file to compile
 * @param  {Function} callback (err, css)
 * @param  {Object}   options  Options from the command line
 */
stylusCompile.render = function (file, callback, options) {
	stylus.render("@import '" + file + "';", callback);
};
