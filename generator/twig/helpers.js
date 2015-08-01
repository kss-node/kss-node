var Kss = require(__dirname + '/../../lib/kss.js');
var fs = require('fs');
var path = require('path');

module.exports.register = function(Twig, config) {

  Twig.extendFunction("isReference", function(reference, options) {
    return (this.reference && reference === this.reference) ? options.fn(this) : options.inverse(this);
  });


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
    type: "markup",
    regex: /^markup$/,
    next: [ ],
    open: true,
    parse: function (token, context, chain) {
      var section = context.section || context.loop.parent.section;
      var markup = section.markup;
      var className = context.modifier ? context.modifier.className : "";

      // Compile the template
      var template = Twig.twig({
        data: markup,
        allowInlineIncludes: true,
        async: false,
        base: config.base
      });
      // Our templates use classes[] and kss-node uses modifier_class, so set both.
      var params = { modifier_class: className };
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
  Twig.extendFilter("render", function(markup) {
    var template = Twig.twig({
      data: markup,
      allowInlineIncludes: true,
      async: false,
      base: config.base
    });
    var params = { modifier_class: 'modifier_class' };
    return template.render(params);
  });

};
