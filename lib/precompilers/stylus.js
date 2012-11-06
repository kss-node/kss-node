var fs = require('fs'),
		stylus = require('stylus'),

		stylusCompile = {

			// Name of the stylesheet language
			name: 'Stylus',

			// File extension for that language
			ext: 'styl',

			// CLI parameter
			param: 's',

			/**
			 * Compiles the passed file to css and passes
			 * the resulting css to the given callback
			 *
			 * @param  {String}   file The file to compile
			 * @param  {Function} cb   callback(css)
			 */
			render: function (file, cb) {
				stylus.render("@import '" + file + "';", function (err, css) {
					if (err) {
						throw err;
					}
					cb(css);
				});
			}
		};

module.exports = stylusCompile;
