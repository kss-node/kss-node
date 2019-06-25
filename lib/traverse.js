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
const glob = require('glob');

function globPromise(pattern, options) {
  return new Promise((resolve, reject) => {
    glob(pattern, options, (err, files) => err === null ? resolve(files) : reject(err));
  });
}

/**
 * Traverse paths, parse its contents, and create a KssStyleGuide.
 *
 * Callbacks receive an instance of `KssStyleGuide`.
 *
 * If you want to parse anything other than css, less, sass, or stylus files
 * then you’ll want to use options.mask to target a different set of file
 * extensions.
 *
 * ```
 * kss.traverse('./stylesheets', { mask: '*.css' }).then(function(styleGuide) {
 *   styleGuide.sections('2.1.1') // <KssSection>
 * });
 * ```
 *
 * There a few extra `options` you can pass to `kss.traverse` which will effect
 * the output:
 *
 * - mask: Use a regex or string (e.g. `*.less|*.css`) to only parse files
 *   matching this value. Defaults to:
 *   `*.css|*.less|*.sass|*.scss|*.styl|*.stylus`
 * - markdown: kss-node supports built-in Markdown formatting of its
 *   documentation, thanks to [markdown-it](https://markdown-it.github.io/). It's
 *   enabled by default, but you can disable it by adding `markdown: false` to
 *   the `options` object.
 * - header: kss-node makes the header available separately from the
 *   description. To make kss-node behave like the Ruby KSS, disable this option
 *   and the title will remain a part of the description. This setting is
 *   enabled by default, but you can disable it by adding `header: false` to
 *   your options.
 *
 * @alias module:kss.traverse
 * @param {String|Array} paths The paths to traverse
 * @param {Object} [options] Options to alter the output content (optional)
 * @returns {Promise} A `Promise` object resolving to a `KssStyleGuide`.
 */
let traverse = function(paths, options) {
  options = options || {};

  // Mask to search for particular file types - defaults to common precompilers.
  options.mask = options.mask || /\.css|\.less|\.sass|\.scss|\.styl|\.stylus/;

  // If the mask is a string, convert it into a RegExp.
  if (!(options.mask instanceof RegExp)) {
    options.mask = new RegExp(
      '(?:' + options.mask.replace(/\./g, '\\.').replace(/\*/g, '.*') + ')$'
    );
  }
  // It should be an array
  if (!Array.isArray(paths)) {
    paths = [paths];
  }

  // transform to wildcard if it’s a directory
  const wildcardsArray = paths.map((directory) => {
    if (fs.existsSync(directory) && fs.lstatSync(directory).isDirectory()) {
      return path.join(directory, '**/*');
    }

    return directory;
  });

  // build a wildcard for glob from array
  const wildcard = wildcardsArray.length > 1 ? `{${wildcardsArray.join(',')}}` : wildcardsArray[0];

  return globPromise(wildcard, {nodir: true}).then((files) => {
    // Read the contents of all the found file names.
    return Promise.all(
      files.filter(file =>{
        return !options.mask || file.match(options.mask);
      }).map(file => {
        return fs.readFileAsync(file, 'utf8').then(contents => {
          return {
            base: options.base || process.cwd(),
            path: file,
            contents: contents
          };
        });
      })
    );
  }).then(files => {
    return parse(files, options);
  });
};

module.exports = traverse;
