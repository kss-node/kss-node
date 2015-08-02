/*eslint-disable camelcase*/

'use strict';

module.exports.register = function(Twig, config) {
  /*
   Compile the template on the fly for the examples section. This supports inline
   twig so we can do things like
   ```
   // Markup:
   // <form>
   // {% include 'twig/components/_button.twig' %}
   // </form>
   ```
   */
  Twig.extendTag({
    type: 'markup',
    regex: /^markup$/,
    next: [],
    open: true,
    parse: function(token, context) {
      var section = context.section || context.loop.parent.section;
      var partial = context.loop.parent.partials[section.reference];
      var markup = partial.markup;
      var className = context.modifier ? context.modifier.className : '';

      // Compile the template
      var template = Twig.twig({
        data: markup,
        allowInlineIncludes: true,
        async: false,
        base: config.base
      });
      // Our templates use classes[] and kss-node uses modifier_class, so set both.
      var params = {
        modifier_class: className
      };
      var output = template.render(params);

      return {
        chain: false,
        output: output
      };
    }
  });


};
