module.exports.register = function(handlebars) {
  console.log('The file containing the Handlebars helper was loaded.');
  /**
   * Returns a string to test for.
   */
  handlebars.registerHelper('test', function() {
    return new handlebars.SafeString('Handlerbars helper loaded into template!');
  });
};
