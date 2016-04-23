'use strict';

module.exports = function(handlebars) {
  handlebars.registerHelper('test', function() {
    // Returns a string to test for.
    return new handlebars.SafeString('Handlebars helper loaded into template!');
  });
};
