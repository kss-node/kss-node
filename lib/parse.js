/*eslint-disable camelcase*/

'use strict';

/**
 * The `kss/lib/parse` module is normally accessed via the
 * [`parse()`]{@link module:kss.parse} method of the `kss` module:
 * ```
 * var kss = require('kss');
 * kss.parse(input, options, callback);
 * ```
 * @private
 * @module kss/lib/parse
 */

var KssStyleguide = require('./kss_styleguide.js'),
  KssSection = require('./kss_section.js'),
  KssModifier = require('./kss_modifier.js'),
  KssParameter = require('./kss_parameter.js'),
  marked = require('marked'),
  natural = require('natural');

var inlineRenderer,
  parse, parseChunk, createModifiers, createParameters, checkReference, findBlocks, processProperty,
  isDeprecated, isExperimental, hasPrefix;

// Create a MarkDown renderer that does not output a wrapping paragraph.
inlineRenderer = new marked.Renderer();
inlineRenderer.paragraph = function(text) {
  return text;
};

/**
 * Parse an array/string of documented CSS, or an object of files
 * and their content.
 *
 * File object formatted as `{ "absolute filename": content, ... }`.
 *
 * This is called automatically as part of `traverse` but is publicly
 * accessible as well.
 *
 * @alias module:kss.parse
 * @param  {Mixed}    input    The input to parse
 * @param  {Object}   options  Options to alter the output content. Same as the options in [`traverse()`]{@link module:kss.traverse}.
 * @param  {Function} callback Called when parsing is complete
 */
parse = function(input, options, callback) {
  var data = {}, fileName, files,
    i, l;

  // If supplied a string, just make it an Array.
  if (typeof input === 'string') {
    input = [input];
  }

  // Otherwise assume the input supplied is a JSON object, as specified above.
  if (!Array.isArray(input)) {
    files = input;
    input = [];
    data.files = [];
    for (fileName in files) {
      if (files.hasOwnProperty(fileName)) {
        input.push(files[fileName]);
        data.files.push(fileName);
      }
    }
    data.files.sort();
  }

  // Default parsing options
  if (typeof options.markdown === 'undefined') {
    options.markdown = true;
  }
  if (typeof options.multiline === 'undefined') {
    options.multiline = true;
  }
  options.typos = options.typos || false;
  options.custom = options.custom || [];

  // Actually parse the input (parseChunk is the key function here.)
  l = input.length;
  data.sections = [];
  data.section_refs = {};

  for (i = 0; i < l; i += 1) {
    data = parseChunk(data, input[i], options) || data;
  }

  callback(false, new KssStyleguide(data));
};

/**
 * Take a chunk of text and parse the comments. This is the primary parsing
 * function, and eventually returns a `data` variable to use to create a new
 * instance of `KssStyleguide`.
 *
 * @private
 * @param  {Object} data    JSON object containing all of the style guide data.
 * @param  {String} input   Text to be parsed, i.e. a single CSS/LESS/etc. file's content.
 * @param  {Object} options The options passed on from `traverse` or `parse`
 * @return {Object} The raw style guide data from the newly parsed text.
 */
parseChunk = function(data, input, options) {
  /* jshint loopfunc: true */

  var currSection, i, l, blocks = [], paragraphs, j, m, hasModifiers, lastModifier;

  // Append the raw text to the body string.
  data.body = data.body || '';
  data.body += '\n\n';
  data.body += input;

  // Retrieve an array of "comment block" strings, and then evaluate each one.
  blocks = findBlocks(input, options);
  l = blocks.length;

  for (i = 0; i < l; i += 1) {
    // Create a new, temporary section object with some default values.
    // "raw" is a comment block from the array above.
    currSection = {
      raw: blocks[i],
      header: '',
      description: '',
      modifiers: [],
      parameters: [],
      markup: false
    };

    // Split the comment block into paragraphs.
    paragraphs = currSection.raw
      .replace(/\r\n/g, '\n')      // Convert Windows CRLF linebreaks.
      .replace(/\r/g, '\n')        // Convert Classic Mac CR linebreaks too.
      .replace(/\n\s+\n/g, '\n\n') // Trim whitespace-only lines.
      .replace(/^\s+|\s+$/g, '')   // Trim the string of white space.
      .split('\n\n');

    // Before anything else, process the properties that are clearly labeled and
    // can be found right away and then removed.
    currSection = processProperty('Markup', paragraphs, options, currSection);
    /*eslint-disable no-loop-func*/
    currSection = processProperty('Weight', paragraphs, options, currSection, function(value) {
      return isNaN(value) ? 0 : parseFloat(value);
    });
    // Process custom properties.
    options.custom.forEach(function(name) {
      currSection = processProperty(name, paragraphs, options, currSection);
    });
    /*eslint-enable no-loop-func*/

    // Ignore this block if a styleguide reference number is not listed.
    currSection.reference = checkReference(paragraphs, options) || '';
    if (!currSection.reference) {
      continue;
    }

    // If the block is 2 paragraphs long, it is just a header and a reference;
    // no need to search for modifiers.
    if (paragraphs.length === 2) {
      currSection.header = currSection.description = paragraphs[0];
    // If it's 3+ paragraphs long, search for modifiers.
    } else if (paragraphs.length > 2) {

      // Extract the approximate header, description and modifiers paragraphs.
      // The modifiers will be split into an array of lines.
      currSection.header = paragraphs[0];
      currSection.description = paragraphs.slice(0, paragraphs.length - 2).join('\n\n');
      currSection.modifiers = paragraphs[paragraphs.length - 2]
        .split('\n');

      // Check the modifiers paragraph. Does it look like it's a list of
      // modifiers, or just another paragraph of the description?
      m = currSection.modifiers.length;
      hasModifiers = true;
      for (j = 0; j < m; j += 1) {
        if (currSection.modifiers[j].match(/^\s*.+?\s+\-\s/g)) {
          lastModifier = j;
        } else if (j === 0) {
          // The paragraph doesn't start with a modifier, so bail out.
          hasModifiers = false;
          j = m;
        } else {
          // If the current line doesn't match a modifier, it must be a
          // multi-line modifier description.
          currSection.modifiers[lastModifier] += ' ' + currSection.modifiers[j].replace(/^\s+|\s+$/g, '');
          // We will strip this blank line later.
          currSection.modifiers[j] = '';
        }
      }
      // Remove any blank lines added.
      /*eslint-disable no-loop-func*/
      currSection.modifiers = currSection.modifiers.filter(function(line) { return line !== ''; });
      /*eslint-enable no-loop-func*/

      // If it's a modifiers paragraph, turn each one into a modifiers object.
      // Otherwise, add it back to the description.
      if (hasModifiers) {
        // If the current section has markup, create proper KssModifier objects.
        if (currSection.markup) {
          currSection.modifiers = createModifiers(currSection.modifiers, options);
        } else {
          // If the current section has no markup, create KssParameter objects.
          currSection.parameters = createParameters(currSection.modifiers, options);
          currSection.modifiers = [];
        }
      } else {
        currSection.description += '\n\n' + paragraphs[paragraphs.length - 2];
        currSection.modifiers = [];
      }
    }

    // Squash the header into a single line.
    currSection.header = currSection.header.replace(/\n/g, ' ');

    // Check the section's status.
    currSection.deprecated = isDeprecated(currSection.description, options);
    currSection.experimental = isExperimental(currSection.description, options);

    // If multi-line descriptions are allowed, remove the first paragraph (the
    // header) from the description.
    if (options.multiline) {
      if (currSection.description.match(/\n{2,}/)) {
        currSection.description = currSection.description.replace(/^.*?\n{2,}/, '');
      } else {
        currSection.description = '';
      }
    }

    // Markdown Parsing.
    if (options.markdown) {
      currSection.description = marked(currSection.description);
    }

    // Add the new section instance to the sections array.
    currSection = new KssSection(currSection);
    data.sections.push(currSection);

    // Store the reference for quick searching later, if it's supplied.
    if (currSection.reference()) {
      data.section_refs[currSection.reference()] = currSection;
    }
  }

  return data;
};

/**
 * Takes an array of modifier lines, and turns it into instances of KssModifier.
 *
 * @private
 * @param  {Array}  lines   Modifier lines, which should all be strings.
 * @param  {Object} options Any options passed on by the functions above.
 * @return {Array} The modifier instances created.
 */
createModifiers = function(lines, options) {
  return lines.map(function(entry) {
    var modifier, description, className;

    // Split modifier name and the description.
    modifier = entry.split(/\s+\-\s+/, 1)[0];
    description = entry.replace(modifier, '', 1).replace(/^\s+\-\s+/, '');

    className = modifier.replace(/\:/g, '.pseudo-class-');

    // Markdown parsing.
    if (options.markdown) {
      description = marked(description, {renderer: inlineRenderer});
    }

    return new KssModifier({
      name: modifier,
      description: description,
      className: className
    });
  });
};

/**
 * Takes an array of parameter lines, and turns it into instances of KssParameter.
 *
 * @private
 * @param  {Array}  lines   Parameter lines, which should all be strings.
 * @param  {Object} options Any options passed on by the functions above.
 * @return {Array} The parameter instances created.
 */
createParameters = function(lines, options) {
  return lines.map(function(entry) {
    var parameter, description;

    // Split parameter name and the description.
    parameter = entry.split(/\s+\-\s+/, 1)[0];
    description = entry.replace(parameter, '', 1).replace(/^\s+\-\s+/, '');

    // Markdown parsing.
    if (options.markdown) {
      description = marked(description, {renderer: inlineRenderer});
    }

    return new KssParameter({
      name: parameter,
      description: description
    });
  });
};

/**
 * Returns an array of comment blocks found within a string.
 *
 * @private
 * @param  {String} input   The string to search.
 * @param  {Object} options Optional parameters to pass. Inherited from `parse`.
 * @return {Array} The blocks found.
 */
findBlocks = function(input, options) {
  /*eslint-disable key-spacing*/
  var currentBlock = '',
    insideSingleBlock = false, insideMultiBlock = false, insideDocblock = false,
    indentAmount = false,
    blocks = [],
    lines, line, i, l,
    commentExpressions = {
      single:         /^\s*\/\/.*$/,
      docblockStart:  /^\s*\/\*\*\s*$/,
      multiStart:     /^\s*\/\*+\s*$/,
      multiFinish:    /^\s*\*\/\s*$/
    };
  /*eslint-enable key-spacing*/

  options = options || {};

  input = input.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  lines = input.split(/\n|$/g);

  l = lines.length;
  for (i = 0; i < l; i += 1) {
    line = lines[i];

    // Remove trailing space.
    line = line.replace(/\s*$/, '');

    // Single-line parsing.
    if (!insideMultiBlock && !insideDocblock && line.match(commentExpressions.single)) {
      if (insideSingleBlock && currentBlock !== '') {
        currentBlock += '\n';
      }
      currentBlock += line.replace(/^\s*\/\/\s?/, '');
      insideSingleBlock = true;
      continue;
    }

    // Since the current line is not a single line comment, save the current
    // block and continue parsing the current line.
    if (insideSingleBlock) {
      blocks.push(currentBlock.replace(/^\n+/, '').replace(/\n+$/, ''));
      insideSingleBlock = false;
      currentBlock = '';
    }

    // Save the current multi-/docblock if we have reached the end of the block.
    if ((insideMultiBlock || insideDocblock) && line.match(commentExpressions.multiFinish)) {
      blocks.push(currentBlock.replace(/^\n+/, '').replace(/\n+$/, ''));
      insideMultiBlock = insideDocblock = false;
      currentBlock = '';
      indentAmount = false;
      continue;
    }

    // Docblock parsing.
    if (line.match(commentExpressions.docblockStart)) {
      insideDocblock = true;
      currentBlock = '';
      continue;
    }
    if (insideDocblock) {
      currentBlock += '\n';
      currentBlock += line.replace(/^\s*\*\s?/, '');
      continue;
    }

    // Multi-line parsing.
    if (line.match(commentExpressions.multiStart)) {
      insideMultiBlock = true;
      currentBlock = '';
      continue;
    }
    if (insideMultiBlock) {
      // If this is the first interior line, determine the indentation amount.
      if (indentAmount === false) {
        // Skip initial blank lines.
        if (line === '') {
          continue;
        }
        indentAmount = line.match(/^\s*/)[0];
      }
      currentBlock += '\n';
      // Always strip same indentation amount from each line.
      currentBlock += line.replace(new RegExp('^' + indentAmount), '', 1);
      continue;
    }
  }

  // Add the last comment block to our list of blocks.
  if (currentBlock) {
    blocks.push(currentBlock.replace(/^\n+/, '').replace(/\n+$/, ''));
  }

  return blocks;
};

/**
 * Check a section for the reference number it may or may not have.
 *
 * @private
 * @param  {Array}  paragraphs An array of the paragraphs in a single block.
 * @param  {Object} options    The options object passed on from the initial functions
 * @return {Boolean|String} False if not found, otherwise returns the reference number as a string.
 */
checkReference = function(paragraphs, options) {
  var lastParagraph = paragraphs[paragraphs.length - 1].trim(),
    words = lastParagraph.split(/\s+/),
    keyword = false,
    reference = false;

  options = options || {};

  // If is only one word in the last paragraph, it can't be a styleguide ref.
  if (words.length < 2) {
    return false;
  }

  // Search for the "styleguide" (or "style guide") keyword at the start of the paragraph.
  [words[0], words[0] + words[1]].forEach(function(value, index) {
    if (!keyword) {
      value = value.replace(/[-\:]?$/, '');
      if (value.toLowerCase() === 'styleguide' || options.typos && natural.Metaphone.compare('Styleguide', value.replace('-', ''))) {
        keyword = words.shift();
        if (index === 1) {
          keyword += ' ' + words.shift();
        }
      }
    }
  });

  if (keyword) {
    reference = words.join(' ');

    // Normalize any " - " delimeters.
    reference = reference.replace(/\s+\-\s+/g, ' - ');

    // Remove trailing dot-zeros and periods.
    reference = reference.replace(/\.$|(\.0){1,}$/g, '');
  }

  return reference;
};

/**
 * Checks if there is a specific property in the comment block and removes it from the original array.
 *
 * @private
 * @param  {String}   propertyName The name of the property to search for
 * @param  {Array}    paragraphs   An array of the paragraphs in a single block
 * @param  {Object}   options      The options object passed on from the initial functions
 * @param  {Object}   sectionData  The original data object of a section.
 * @param  {Function} processValue A function to massage the value before it is inserted into the sectionData.
 * @return {Object} A new data object for the section.
 */
processProperty = function(propertyName, paragraphs, options, sectionData, processValue) {
  var indexToRemove = 'not found';

  propertyName = propertyName.toLowerCase();

  paragraphs.map(function(paragraph, index) {
    if (hasPrefix(paragraph, options, propertyName)) {
      sectionData[propertyName] = paragraph.replace(new RegExp('^\\s*' + propertyName + '\\:\\s+?', 'gmi'), '');
      if (typeof processValue === 'function') {
        sectionData[propertyName] = processValue(sectionData[propertyName]);
      }
      paragraph = '';
      indexToRemove = index;
    }
    return paragraph;
  });

  if (indexToRemove !== 'not found') {
    paragraphs.splice(indexToRemove, 1);
  }

  return sectionData;
};

/**
 * Check if the description indicates that a section is deprecated.
 *
 * @private
 * @param  {String}  description The description of that section
 * @param  {Object}  options     The options passed on from previous functions
 * @return {Boolean} Whether the description indicates the section is deprecated.
 */
isDeprecated = function(description, options) {
  return hasPrefix(description, options, 'Deprecated');
};

/**
 * Check if the description indicates that a section is experimental.
 *
 * @private
 * @param  {String}  description The description of that section
 * @param  {Object}  options     The options passed on from previous functions
 * @return {Boolean} Whether the description indicates the section is experimental.
 */
isExperimental = function(description, options) {
  return hasPrefix(description, options, 'Experimental');
};

/**
 * Essentially this function checks if a string is prefixed by a particular attribute,
 * e.g. 'Deprecated:' and 'Markup:'
 *
 * If `options.typos` is enabled it'll try check if the first word at least sounds like
 * the word we're checking for.
 *
 * @private
 * @param  {String}  description The string to check
 * @param  {Object}  options     The options passed on from previous functions
 * @param  {String}  prefix      The prefix to search for
 * @return {Boolean} Whether the description contains the specified prefix.
 */
hasPrefix = function(description, options, prefix) {
  var words;
  if (!options.typos) {
    return !!description.match(new RegExp('^\\s*' + prefix + '\\:', 'gmi'));
  }

  words = description.replace(/^\s*/, '').match(/^\s*([a-z ]*)\:/gmi);
  if (!words) {
    return false;
  }

  return natural.Metaphone.compare(words[0].replace(':', ''), prefix);
};

module.exports = parse;
