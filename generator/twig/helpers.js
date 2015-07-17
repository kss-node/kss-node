'use strict';

var Kss = require('../../lib/kss.js');

module.exports.register = function(Twig, config) {
  config = config || {};

  /**
   * Returns a single section, found by its reference number
   * @param  {String|Number} reference The reference number to search for.
   */
  Twig.extendFilter('section', function(reference, options) {
    var section = options.data.root.styleguide.section(reference);
    return section ? options.fn(section.data) : false;
  });


  Twig.extendFilter("backwords", function(value) {
    return value.split(" ").reverse().join(" ");
  });

};
