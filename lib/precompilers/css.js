var fs = require('fs'),
    compiler = module.exports = {};

// Name of the stylesheet language
compiler.name = 'css';
compiler.type = 'style';

// File extension for that language
compiler.extensions = ['css'];

/**
 * Pass through, just reads the file.
 *
 * @param  {String}   file     The file to compile
 * @param  {Function} callback (err, css)
 * @param  {Object}   options  Options from the command line
 */
compiler.render = function (filename, callback, options) {
  var css;
  try {
    css = fs.readFileSync(filename, 'utf8');
    callback(null, css);
  }
  catch(e) {
    callback(e)
  }
};
