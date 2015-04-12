'use strict';

var parse = require('./parse.js'),
  path = require('path'),
  fs = require('fs');

var traverse;

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
  var fileNames = [],
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
  walkFinished = function() {
    /*eslint-disable no-loop-func*/
    var i, l = fileNames.length, files = [], orderedObject = {};

    fileNames.sort();
    for (i = 0; i < l; i += 1) {
      (function(j) {
        fs.readFile(fileNames[j], 'utf8', function(err, contents) {
          if (err) { callback(err); return; }

          files[j] = contents;
          fileCounter -= 1;

          if (fileCounter === 0) {
            files.map(function(fileContent, index) {
              var filename = fileNames[index];
              orderedObject[filename] = fileContent;
              return '';
            });
            parse(orderedObject, options, callback);
          }
        });
      }(i));
    }
  };

  // Courtesy of [stygstra](https://gist.github.com/514983)
  walk = function(directories, opts, cb) {
    opts = opts || {};
    if (typeof cb !== 'function') { cb = function() {}; }

    if (!Array.isArray(directories)) {
      directories = [directories];
    }

    // Loop through all the given directories.
    loopsRemaining += directories.length;
    directories.forEach(function(dir) {
      loopsRemaining -= 1;

      // Start an asynchronous search of the file system.
      filesRemaining += 1;
      fs.readdir(dir, function(err, relnames) {
        if (err) {
          cb(err);
          return;
        }

        // About to start looping through the directory contents.
        loopsRemaining += relnames.length;
        // The fs.readdir() callback has returned.
        filesRemaining -= 1;

        // If there is no more file system to search, call .finished().
        if (filesRemaining === 0 && loopsRemaining === 0) {
          cb(null);
        }

        // Otherwise, if readdir() has results, loop through them.
        relnames.forEach(function(relname) {
          loopsRemaining -= 1;
          var name = path.join(dir, relname);

          // Start an asynchronous stat of this file system item.
          filesRemaining += 1;
          fs.stat(name, function(error, stat) {
            if (error) {
              cb(error);
              return;
            }

            if (stat.isDirectory()) {
              if (name !== '.svn' && name !== '.git') {
                walk(name, opts, cb);
              }
            } else if (!opts.mask || name.match(opts.mask)) {
              name = name.replace(/\\/g, '/');
              fileNames.push(name);
              fileCounter += 1;
            }

            // The fs.stat() callback has returned.
            filesRemaining -= 1;

            // If there is no more file system to search, call .finished().
            if (filesRemaining === 0 && loopsRemaining === 0) {
              cb(null);
              return;
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
