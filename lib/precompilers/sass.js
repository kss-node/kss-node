var fs = require('fs'),
    sass = require('sass'),

    sassCompile = {

      // Name of the stylesheet language
      name: 'SASS',

      // File extension for that language
      ext: 'sass',

      /**
       * Compiles the passed file to css and passes
       * the resulting css to the given callback
       *
       * @param  {String}   file The file to compile
       * @param  {Function} cb   callback(css)
       */
      render: function (file, cb) {
        // sass.render("@import '" + file + "';", function (err, css) {
        //   if (err) {
        //     throw new Error(err);
        //   }
        //   cb(css);
        // });
        var css = sass.render("@import '" + file + "';");
        cb(css);
      }
    };

module.exports = sassCompile;
