// Courtesy of [stygstra](https://gist.github.com/514983)
var fs = require("fs");
var path = require("path");

module.exports = (function() {


	function walk(directories, options, callbacks) {

		var filesRemaining = 0,
			loopsRemaining = 0;

		var walkInternal = function(directories, options, callbacks) {
			callbacks = callbacks || {};
			options = options || {};
			if (typeof callbacks.finished !== 'function') { callbacks.finished = function(){}; }
			if (typeof callbacks.file !== 'function')     { callbacks.file = function(){}; }

			if (!Array.isArray(directories)) {
				directories = [directories];
			}

			// Loop through all the given directories.
			loopsRemaining += directories.length;
			directories.forEach(function(directory, index, directories) {
				loopsRemaining -= 1;

				// Start an asynchronous search of the file system.
				filesRemaining += 1;
				fs.readdir(directory, function(err, relnames) {
					if (err) {
						callbacks.finished(err);
						return;
					}

					// About to start looping through the directory contents.
					loopsRemaining += relnames.length;
					// The fs.readdir() callback has returned.
					filesRemaining -= 1;

					// If there is no more file system to search, call .finished().
					if (filesRemaining === 0 && loopsRemaining === 0) {
					  callbacks.finished(null);
					}

					// Otherwise, if readdir() has results, loop through them.
					relnames.forEach(function(relname, index, relnames) {
						loopsRemaining -= 1;
						var name = path.join(directory, relname);

						// Start an asynchronous stat of this file system item.
						filesRemaining += 1;
						fs.stat(name, function(err, stat) {
							if (err) {
								callbacks.finished(err);
								return;
							}

							if (stat.isDirectory()) {
								if (name !== '.svn' && name !== '.git') {
									walkInternal(name, options, callbacks);
								}
							}
							else if (!options.mask || name.match(options.mask)) {
								callbacks.file(name);
							}

							// The fs.stat() callback has returned.
							filesRemaining -= 1;

							// If there is no more file system to search, call .finished().
							if (filesRemaining === 0 && loopsRemaining === 0) {
								callbacks.finished(null);
							}
						});
					});
				});
			});
		};

		walkInternal(directories, options, callbacks);
	}

	return walk;
})();
