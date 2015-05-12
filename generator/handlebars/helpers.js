// @TODO Re-enable this eslint rule.
/*eslint-disable valid-jsdoc*/

'use strict';

var Kss = require('../../lib/kss.js');

module.exports.register = function(handlebars, config) {
  config = config || {};

  /**
   * Returns a single section, found by its reference number
   * @param  {String|Number} reference The reference number to search for.
   */
  handlebars.registerHelper('section', function(reference, options) {
    var section = options.data.root.styleguide.section(reference);

    return section ? options.fn(section.data) : false;
  });

  /**
   * Loop over a section query. If a number is supplied, will convert into
   * a query for all children and descendants of that reference.
   * @param  {Mixed} query The section query
   */
  handlebars.registerHelper('eachSection', function(query, options) {
    var styleguide = options.data.root.styleguide,
      buffer = '',
      sections,
      i, l;

    if (!query.match(/\bx\b|\*/g)) {
      query = query + '.*';
    }
    sections = styleguide.section(query);
    if (!sections) {
      return '';
    }

    l = sections.length;
    for (i = 0; i < l; i += 1) {
      buffer += options.fn(sections[i].data);
    }

    return buffer;
  });

  /**
   * Loop over each section root, i.e. each section only one level deep.
   */
  handlebars.registerHelper('eachRoot', function(options) {
    var buffer = '',
      sections = options.data.root.styleguide.section('x'),
      i, l;

    if (!sections) {
      return '';
    }

    l = sections.length;
    for (i = 0; i < l; i += 1) {
      buffer += options.fn(sections[i].data);
    }

    return buffer;
  });

  /**
   * Equivalent to "if the given reference is numeric". e.g:
   *
   * {{#ifNumeric reference}}
   *    REFERENCES LIKE 4.0 OR 4.1.14
   *   {{else}}
   *    ANYTHING ELSE
   * {{/ifNumeric}}
   */
  handlebars.registerHelper('ifNumeric', function(reference, options) {
    return (typeof reference === 'number' || typeof reference === 'string' && reference.match(/^[\.\d]+$/)) ? options.fn(this) : options.inverse(this);
  });

  /**
   * Equivalent to "if the current reference is X". e.g:
   *
   * {{#ifReference 'base.headings'}}
   *    IF CURRENT REFERENCE IS base.headings ONLY
   *   {{else}}
   *    ANYTHING ELSE
   * {{/ifReference}}
   */
  handlebars.registerHelper('ifReference', function(reference, options) {
    return (this.reference && reference === this.reference) ? options.fn(this) : options.inverse(this);
  });

  /**
   * Equivalent to "unless the current reference is X". e.g:
   *
   * {{#unlessReference 'base.headings'}}
   *    ANYTHING ELSE
   *   {{else}}
   *    IF CURRENT REFERENCE IS base.headings ONLY
   * {{/unlessReference}}
   */
  handlebars.registerHelper('unlessReference', function(reference, options) {
    return (!this.reference || reference !== this.reference) ? options.fn(this) : options.inverse(this);
  });

  /**
   * Equivalent to "if the current section is X levels deep". e.g:
   *
   * {{#ifDepth 1}}
   *    ROOT ELEMENTS ONLY
   *   {{else}}
   *    ANYTHING ELSE
   * {{/ifDepth}}
   */
  handlebars.registerHelper('ifDepth', function(depth, options) {
    return (this.depth && depth === this.depth) ? options.fn(this) : options.inverse(this);
  });

  /**
   * Equivalent to "unless the current section is X levels deep". e.g:
   *
   * {{#unlessDepth 1}}
   *    ANYTHING ELSE
   *   {{else}}
   *    ROOT ELEMENTS ONLY
   * {{/unlessDepth}}
   */
  handlebars.registerHelper('unlessDepth', function(depth, options) {
    return (!this.depth || depth !== this.depth) ? options.fn(this) : options.inverse(this);
  });

  /**
   * Similar to the {#eachSection} helper, however will loop over each modifier
   * @param  {Object} section Supply a section object to loop over its modifiers. Defaults to the current section.
   */
  handlebars.registerHelper('eachModifier', function() {
    var modifiers,
      options = arguments[arguments.length - 1],
      buffer = '',
      i, l;

    // Default to current modifiers, but allow supplying a custom section.
    modifiers = (arguments.length > 1 && arguments[0].data) ? arguments[0].data.modifiers : this.modifiers;

    if (!modifiers) {
      return '';
    }

    l = modifiers.length;
    for (i = 0; i < l; i++) {
      buffer += options.fn(modifiers[i].data || '');
    }
    return buffer;
  });

  /**
   * Similar to the {#eachSection} helper, however will loop over each parameter
   * @param  {Object} section Supply a section object to loop over its parameters. Defaults to the current section.
   */
  handlebars.registerHelper('eachParameter', function() {
    var parameters,
      options = arguments[arguments.length - 1],
      buffer = '',
      i, l;

    // Default to current parameters, but allow supplying a custom section.
    parameters = (arguments.length > 1 && arguments[0].data) ? arguments[0].data.parameters : this.parameters;

    if (!parameters) {
      return '';
    }

    l = parameters.length;
    for (i = 0; i < l; i++) {
      buffer += options.fn(parameters[i].data || '');
    }
    return buffer;
  });

  /**
   * Outputs the current section's or modifier's markup.
   */
  handlebars.registerHelper('markup', function(options) {
    var partials = options.data.root.partials,
      section,
      modifier = false,
      template,
      partial,
      data;

    if (!this) {
      return '';
    }

    // Determine if the element is a section object or a modifier object.
    if (this.modifiers) {
      // If this is the section object, use the default markup without a modifier class.
      section = new Kss.KssSection(this);
    } else {
      // If this is the markup object, find the modifier class and the section object.
      modifier = new Kss.KssModifier(this);
      section = modifier.section();
    }

    // Load the information about this section's markup partial.
    partial = partials[section.reference()];

    // Prepare the sample data for the partial.
    data = JSON.parse(JSON.stringify(partial.data));
    /*eslint-disable camelcase*/
    if (data.modifier_class) {
      data.modifier_class += ' ';
    } else {
      data.modifier_class = '';
    }
    data.modifier_class += modifier ? modifier.className() : config.placeholder;
    /*eslint-enable camelcase*/

    // Compile the section's markup partial into a template.
    template = handlebars.compile('{{> "' + partial.name + '"}}');
    // We don't wrap the rendered template in "new handlebars.SafeString()" since
    // we want the ability to display it as a code sample with {{ }} and as
    // rendered HTML with {{{ }}}.
    return template(data);
  });

  /**
   * Deprecated variable replaced with {{homepage}}.
   */
  handlebars.registerHelper('overview', function() {
    throw new Error('The overview variable is deprecated; if your template has {{overview}}, replace it with {{homepage}}.');
  });

  /**
   * Deprecated variable replaced with {{depth}}.
   */
  handlebars.registerHelper('refDepth', function() {
    throw new Error('The refDepth variable is deprecated; if your template has {{refDepth}}, replace it with {{depth}}.');
  });

  /**
   * Deprecated variable replaced with {{rootName}}.
   */
  handlebars.registerHelper('rootNumber', function() {
    throw new Error('The rootNumber variable is deprecated; if your template has {{rootNumber}}, replace it with {{rootName}}.');
  });

  /**
   * Deprecated helper replaced with {{{expression}}}.
   */
  handlebars.registerHelper('html', function() {
    throw new Error('{{html expression}} is deprecated; use HandleBars’ triple-stash instead: {{{expression}}}.');
  });

  /**
   * Deprecated helper replaced with {{#if markup}}...{{/if}}.
   */
  handlebars.registerHelper('ifAny', function() {
    throw new Error('IfAny is deprecated; if your template has {{#ifAny markup modifiers}}...{{/ifAny}}, replace it with {{#if markup}}...{{/if}}.');
  });

  /**
   * Deprecated helper replaced with {{{markup}}}.
   */
  handlebars.registerHelper('modifierMarkup', function() {
    throw new Error('The modifierMarkup Handlebars helper is deprecated; if your template has {{modifierMarkup}}, replace it with {{{markup}}}.');
  });

  /**
   * Deprecated helper replaced with {{ifDepth expression}}.
   */
  handlebars.registerHelper('whenDepth', function() {
    throw new Error('{{whenDepth expression}} is deprecated; use {{ifDepth expression}} instead.');
  });

};
