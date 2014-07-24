var fs = require('fs'),
		stylus = require('stylus'),
		stylusCompile = module.exports = {},
		nib;

// Include CSS3 extensions with nib, if available. Otherwise fail silently.
try {
	nib = require('nib');
} catch (err) {}

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
	var styles = stylus("@import '" + file + "';");
	// Use nib if it is available.
	if (nib) {
		styles.include(nib.path);
	}
	styles.render(callback);
};
