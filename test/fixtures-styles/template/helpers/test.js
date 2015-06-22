module.exports.register = function(handlebars) {
  'use strict';

  console.log('The file containing the Handlebars helper was loaded.');

  handlebars.registerHelper('test', function() {
    // Returns a string to test for.
    return new handlebars.SafeString('Handlerbars helper loaded into template!');
  });
};
