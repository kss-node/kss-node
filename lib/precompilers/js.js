var fs = require('fs'),
    compiler = module.exports = {};

// Name of the stylesheet language
compiler.name = 'js';

// File extension for that language
compiler.extensions = ['js'];

/**
 * Pass through, just reads the file.
 *
 * @param  {String}   file     The file to compile
 * @param  {Function} callback (err, js)
 * @param  {Object}   options  Options from the command line
 */
compiler.render = function (filename, callback, options) {
  var js;
  try {
    js = fs.readFileSync(filename, 'utf8');
    callback(null, js);
  }
  catch(e) {
    callback(e)
  }
};
