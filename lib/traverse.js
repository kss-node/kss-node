'use strict';

/**
 * The `kss/lib/traverse` module is normally accessed via the
 * [`traverse()`]{@link module:kss.traverse} method of the `kss` module:
 * ```
 * const kss = require('kss');
 * let styleGuide = kss.traverse(directory, options);
 * ```
 * @private
 * @module kss/lib/traverse
 */

const parse = require('./parse.js'),
  path = require('path'),
  Promise = require('bluebird');

const fs = Promise.promisifyAll(require('fs-extra'));

/**
 * Traverse a directory, parse its contents, and create a KssStyleGuide.
 *
 * Callbacks receive an instance of `KssStyleGuide`.
 *
 * If you want to parse anything other than css, less, sass, or stylus files
 * then you'll want to use options.mask to target a different set of file
 * extensions.
 *
 * ```
 * kss.traverse('./stylesheets', { mask: '*.css' }).then(function(styleGuide) {
 *   styleGuide.sections('2.1.1') // <KssSection>
 * });
 * ```
 *
 * There a few extra `options` you can pass to `kss.traverse` which will effect
 * the output generated:
 *
 * - mask: Use a regex or string (e.g. `*.less|*.css`) to only parse files
 *   matching this value. Defaults to:
 *   `*.css|*.less|*.sass|*.scss|*.styl|*.stylus`
 * - markdown: kss-node supports built-in Markdown formatting of its
 *   documentation, thanks to [marked](https://github.com/chjj/marked). It's
 *   enabled by default, but you can disable it by adding `markdown: false` to
 *   the `options` object.
 * - header: kss-node makes the header available separately from the
 *   description. To make kss-node behave like the Ruby KSS, disable this option
 *   and the title will remain a part of the description. This setting is
 *   enabled by default, but you can disable it by adding `header: false` to
 *   your options.
 * - typos: Thanks to [natural](https://github.com/NaturalNode/natural),
 *   kss-node can parse keywords phonetically rather then by their string value.
 *   In short: make a typo and the library will do its best to read it anyway.
 *   Enabled by default.
 *
 * @alias module:kss.traverse
 * @param {String|Array} directories The directories to traverse
 * @param {Object} [options] Options to alter the output content (optional)
 * @returns {Promise} A `Promise` object resolving to a `KssStyleGuide`.
 */
let traverse = function(directories, options) {
  options = options || {};

  // Mask to search for particular file types - defaults to common precompilers.
  options.mask = options.mask || /\.css|\.less|\.sass|\.scss|\.styl|\.stylus/;

  // If the mask is a string, convert it into a RegExp.
  if (!(options.mask instanceof RegExp)) {
    options.mask = new RegExp(
      '(?:' + options.mask.replace(/\./g, '\\.').replace(/\*/g, '.*') + ')$'
    );
  }

  if (!Array.isArray(directories)) {
    directories = [directories];
  }

  let fileNames = [];

  let walk = function(directory) {
    // Read the contents of the directory.
    return fs.readdirAsync(directory).then(function(relnames) {
      // If there are no files/folders, declare success.
      if (relnames.length === 0) {
        return Promise.resolve();
      }

      // Otherwise, loop through directory contents.
      return Promise.all(
        relnames.map(relname => {
          let name = path.join(directory, relname);

          // Check if the directory item is a directory or file.
          return fs.statAsync(name).then(function(stat) {
            // Recursively search any directories.
            if (stat.isDirectory()) {
              if (relname !== '.svn' && relname !== '.git') {
                return walk(name, options);
              }
            // If the file matches our mask, save its path.
            } else if (!options.mask || name.match(options.mask)) {
              fileNames.push(name);
            }
            return Promise.resolve();
          });
        })
      );
    });
  };

  // Get each file in the target directory, order them alphabetically and then
  // parse their output.

  // Loop through all the given directories.
  return Promise.all(
    directories.map(function(directory) {
      // Normalize the directory path and then "walk" it, collecting file names in
      // the fileNames variable.
      return walk(path.normalize(directory), options);
    })
  ).then(function() {
    // Read the contents of all the found fileNames.
    let files = [];
    return Promise.all(
      fileNames.map(function(name, index) {
        return fs.readFileAsync(name, 'utf8').then(function(contents) {
          files[index] = contents;
          return Promise.resolve();
        });
      })
    ).then(function() {
      return files;
    });
  }).then(function(files) {
    // Create a sorted object of file names and contents.
    let orderedObject = {};
    fileNames.sort();
    fileNames.forEach((name, index) => {
      orderedObject[name] = files[index];
    });
    return orderedObject;
  }).then(result => {
    return parse(result, options);
  });
};

module.exports = traverse;
