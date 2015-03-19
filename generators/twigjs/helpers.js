var Kss = require(__dirname + '/../../lib/kss.js');
var fs = require('fs');
var path = require('path');

module.exports.register = function(Twig, config) {

  Twig.extendTag({
    type: "markup",
    regex: /^markup$/,
    next: [ ],
    open: true,
    parse: function (token, context, chain) {
      var section = context.section || context.loop.parent.section;
      var markup = section.markup;
      var className = context.modifier ? context.modifier.className : "";

      // Are there any extended templates?
      // {% include "../../twig/components/_button.twig" %}
      var regex = /{%\s*include\s+"(.+?.[html|twig])"(.+)%}/g;
      markup = markup.replace(regex, function(match, partial_file, args) {
        var template = fs.readFileSync(config.source + "/" + partial_file, 'utf8');
        var options = {};
        if ( args && args.indexOf('with') > -1 ) {
          // get the contents of {} which must be valid JSON
          var match = /({.+})/.exec(args);
          options = JSON.parse(match[1]) || {};
        }
        options.classes = [className];
        return Twig.twig({ data: template, async: false }).render(options);
      });

      // Compile the template
      var output  = Twig.twig({ data: markup }).render({ modifier_class: className });
      return {
        chain: false,
        output: output
      };
    }
  });

};
