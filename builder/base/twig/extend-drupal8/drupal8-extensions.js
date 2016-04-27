'use strict';

// @TODO: Add mocha tests for each of Drupal's Twig extensions.
module.exports = /* istanbul ignore next */ function(Twig) {
  // We need access to the internal Twig object.
  let internalTwig;
  Twig.extend(function(Twig) {
    internalTwig = Twig;
  });

  // Add null Twig functions to ensure Drupal's custom Twig functions do not
  // break Twig.js.
  ['attach_library'].forEach(name => {
    Twig.extendFunction(name, function() {
      return '';
    });
  });

  // Add pass-through Twig functions to ensure Drupal's custom Twig functions do
  // not break Twig.js.
  ['render_var', 'url', 'file_url', 'active_theme_path', 'active_theme'].forEach(functionName => {
    Twig.extendFunction(functionName, function(value) {
      return value;
    });
  });

  Twig.extendFunction('link', function(text, url) {
    // @TODO: We ignore attributes for now. PRs welcome!
    // function (text, url, attributes) {
    return '<a href="' + url + '">' + text + '</a>';
  });

  // Add pass-through Twig filters to ensure Drupal's custom Twig functions do
  // not break Twig.js.
  ['t', 'trans', 'placeholder', 'without', 'clean_class', 'clean_id', 'render', 'format_date'].forEach(filterName => {
    Twig.extendFilter(filterName, function(value) {
      return value;
    });
  });

  // Ensure Drupal's |drupal_escape filter does not break Twig.js.
  Twig.extendFilter('drupal_escape', function() {
    // Use the normal |escape filter.
    return internalTwig.filters.escape.apply(null, arguments);
  });

  // Ensure Drupal's |safe_join filter does not break Twig.js.
  Twig.extendFilter('safe_join', function() {
    // Use the normal |join filter.
    return internalTwig.filters.join.apply(null, arguments);
  });

  // @TODO: Add trans/endtrans tags.
  // Twig.extendTag({
  //   // Format: {% trans %}
  // });
  // Twig.extendTag({
  //   // Format: {% endtrans %}
  // });
};
