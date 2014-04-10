var fs = require('fs'),
		less = require('less'),
		lessCompile = module.exports = {};

// Name of the stylesheet language
lessCompile.name = 'less';

// File extension for that language
lessCompile.extensions = ['less'];

/**
 * Compiles the passed file to css and passes
 * the resulting css to the given callback
 *
 * @param  {String}   file     The file to compile
 * @param  {Function} callback (err, css)
 * @param  {Object}   options  Options from the command line
 */
lessCompile.render = function (file, callback, options) {
	less.render("@import '" + file + "';", callback);
};
