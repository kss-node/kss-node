'use strict';

module.exports = function(Twig) {
  Twig.extend(function(Twig) {
    Twig.exports.exampleExtension = function() {
      return 'Example Twig extension loaded.';
    };
  });

  // Add an example filter.
  Twig.extendFilter('example', function() {
    return 'Example Twig filter loaded.';
  });
};
