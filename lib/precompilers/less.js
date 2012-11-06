var fs = require('fs'),
		less = require('less'),

		lessCompile = {

			// Name of the stylesheet language
			name: 'LESS',

			// File extension for that language
			ext: 'less',

			// CLI parameter
			param: 'l',

			/**
			 * Compiles the passed file to css and passes
			 * the resulting css to the given callback
			 *
			 * @param  {String}   file The file to compile
			 * @param  {Function} cb   callback(css)
			 */
			render: function (file, cb) {
				less.render("@import '" + file + "';", function (err, css) {
					if (err) {
						throw err;
					}
					cb(css);
				});
			}
		};

module.exports = lessCompile;
