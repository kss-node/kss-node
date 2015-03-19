var Kss = require(__dirname + '/../../lib/kss.js');

module.exports.register = function(Twig) {

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
      var output  = Twig.twig({ data: markup }).render({ modifier_class: className });
      return {
        chain: false,
        output: output
      };
    }
  });

};
