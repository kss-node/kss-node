var fs = require('fs'),
		stylus = require('stylus'),
		stylusCompile = module.exports = {};

// include nib, if nib module is installed
// otherwise fail silently
try {
	var nib = require('nib');
} catch (err) {
	// ignore
}

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
 */
stylusCompile.render = function (file, callback) {
	var out = stylus("@import '" + file + "';")
	// if nib was required successfully, use it.
	if (nib) out.include(nib.path)
	out.render(callback);
};
