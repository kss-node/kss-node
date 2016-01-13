'use strict';

module.exports.register = function(handlebars, config) {
  config = config || {};

  /**
   * Outputs the current section's or modifier's markup.
   */
  handlebars.registerHelper('markup', function() {
    let options = arguments[arguments.length - 1];

    if (!this) {
      return options.inverse('');
    }

    // Assume the current context is the section we want unless one is passed as
    // the first parameter of this helper.
    let section = (arguments.length > 1) ? arguments[0] : this;

    // Verify we found a JSON representation of a KssSection object.
    if (!section.reference) {
      throw new handlebars.Exception('{{markup}} helper must be used in a Section object or passed a Section object as the first parameter.');
    }

    // Load the information about this section's markup partial.
    let partial = options.data.root.partials[section.reference];

    // Copy the partial.data so we can modify it for this markup instance.
    let data = JSON.parse(JSON.stringify(partial.data));

    // Display the modifier_class hash (if given), or the modifier's className,
    // or the placeholder text if this section has modifiers.
    /* eslint-disable camelcase */
    // Use any modifier_class that was hard-coded in partial.data.
    if (data.modifier_class) {
      data.modifier_class += ' ';
    } else {
      data.modifier_class = '';
    }
    if (options.hash['modifier_class']) {
      data.modifier_class += options.hash['modifier_class'];
    } else if (this.className) {
      data.modifier_class += this.className;
    } else if (section.modifiers.length !== 0) {
      data.modifier_class += config.placeholder;
    }
    /* eslint-enable camelcase */

    // Compile the section's markup partial into a template.
    let template = handlebars.compile('{{> "' + partial.name + '"}}');
    // We don't wrap the rendered template in "new handlebars.SafeString()" since
    // we want the ability to display it as a code sample with {{ }} and as
    // rendered HTML with {{{ }}}.
    return template(data);
  });

  /**
   * Outputs console.log() debugging information for each parameter given.
   *
   * If no parameters are given, the entire context is output with
   * `console.log(this)`.
   */
  handlebars.registerHelper('consoleLog', function() {
    if (arguments.length > 1) {
      // 'options' is automatically passed as the last argument, so skip it.
      for (let i = 0; i < arguments.length - 1; i++) {
        console.log(arguments[i]);
      }
    } else {
      console.log('==================== Current Handlebars context:');
      console.log(this);
      console.log('====================');
    }
    return '';
  });
};
