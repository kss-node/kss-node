var parse = require('./parse.js'),
	path = require('path'),
	fs = require('fs'),
	traverse;

/**
 * TraversesParse a whole directory and its contents.
 *
 * Callback returns an instance of `KssStyleguide`
 *
 * @param  {String|Array} directory The directory(s) to traverse
 * @param  {Object}       options   Options to alter the output content
 * @param  {Function}     callback  Called when traversal AND parsing is complete
 */
traverse = function(directory, options, callback) {
	var self = this,
		files = [],
		fileCounter = 0,
		filesRemaining = 0,
		loopsRemaining = 0,
		walkFinished,
		walk;

	options = options || {};
	if (typeof options === 'function') {
		callback = options;
		options = {};
	}
	if (typeof callback === 'undefined') {
		throw new Error('No callback supplied for KSS.traverse!');
	}

	// Mask to search for particular file types - defaults to common precompilers.
	options.mask = options.mask || /\.css|\.less|\.sass|\.scss|\.styl|\.stylus/;

	// If the mask is a string, convert it into a RegExp.
	if (!(options.mask instanceof RegExp)) {
		options.mask = new RegExp(
			'(?:' + options.mask.replace(/\./g, '\\.').replace(/\*/g, '.*') + ')$'
		);
	}

	// Normalize all the directory paths.
	if (!Array.isArray(directory)) {
		directory = [directory];
	}
	for (var key in directory) {
		directory[key] = path.normalize(directory[key]);
	}

	// Callback for walk() when it has finished traversing all directories.
	walkFinished = function(err) {
		/* jshint loopfunc: true */
		var i, l = files.length, fileContents = [], orderedObject = {};

		files.sort();
		for (i = 0; i < l; i += 1) {
			(function(j){
				fs.readFile(files[j], 'utf8', function(err, contents) {
					if (err) { callback(err); return; }

					fileContents[j] = contents;
					fileCounter -= 1;

					if (fileCounter === 0) {
						fileContents.map(function(contents, index) {
							var filename = files[index];
							orderedObject[filename] = contents;
							return '';
						});
						parse(orderedObject, options, callback);
					}
				});
			}(i));
		}
	};

	// Courtesy of [stygstra](https://gist.github.com/514983)
	walk = function(directories, options, callback) {
		options = options || {};
		if (typeof callback !== 'function') { callback = function(){}; }

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
					callback(err);
					return;
				}

				// About to start looping through the directory contents.
				loopsRemaining += relnames.length;
				// The fs.readdir() callback has returned.
				filesRemaining -= 1;

				// If there is no more file system to search, call .finished().
				if (filesRemaining === 0 && loopsRemaining === 0) {
				  callback(null);
				}

				// Otherwise, if readdir() has results, loop through them.
				relnames.forEach(function(relname, index, relnames) {
					loopsRemaining -= 1;
					var name = path.join(directory, relname);

					// Start an asynchronous stat of this file system item.
					filesRemaining += 1;
					fs.stat(name, function(err, stat) {
						if (err) {
							callback(err);
							return;
						}

						if (stat.isDirectory()) {
							if (name !== '.svn' && name !== '.git') {
								walk(name, options, callback);
							}
						}
						else if (!options.mask || name.match(options.mask)) {
							name = name.replace(/\\/g, '/');
							files.push(name);
							fileCounter += 1;
						}

						// The fs.stat() callback has returned.
						filesRemaining -= 1;

						// If there is no more file system to search, call .finished().
						if (filesRemaining === 0 && loopsRemaining === 0) {
							callback(null);
						}
					});
				});
			});
		});
	};

	// Get each file in the target directory, order them alphabetically and then
	// parse their output.
	walk(directory, options, walkFinished);
};
module.exports = traverse;
