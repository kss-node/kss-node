'use strict';

module.exports.register = function(Twig, config) {

  /*
    Compile the template on the fly for the examples section. This supports inline
    twig so we can do things like

    ```
    // Markup:
    // <form>
    // {% include "twig/components/_button.twig" %}
    // </form>
    ```
  */
  Twig.extendTag({
    type: 'markup',
    regex: /^markup$/,
    next: [ ],
    open: true,
    /*eslint-disable no-unused-vars*/
    parse: function(token, context, chain) {
      /*eslint-enable no-unused-vars*/
      var section = context.section || context.loop.parent.section;
      var markup = section.markup;
      var className = context.modifier ? context.modifier.className : '';

      // Compile the template
      var template = Twig.twig({
        data: markup,
        allowInlineIncludes: true,
        async: false,
        base: config.base
      });
      // Our templates use classes[] and kss-node uses modifier_class, so set both.
      /*eslint-disable camelcase*/
      var params = {modifier_class: className};
      /*eslint-enable camelcase*/
      var output = template.render(params);

      return {
        chain: false,
        output: output
      };
    }
  });

  /*
    {{ section.markup|render|raw }}
    Compile the template on the fly for the raw markup HTML.
  */
  Twig.extendFilter('render', function(markup) {
    var template = Twig.twig({
      data: markup,
      allowInlineIncludes: true,
      async: false,
      base: config.base
    });
    /*eslint-disable camelcase*/
    var params = {modifier_class: 'modifier_class'};
    /*eslint-enable camelcase*/
    return template.render(params);
  });

};
