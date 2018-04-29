'use strict';

/**
 * The `kss/lib/parse` module is normally accessed via the
 * [`parse()`]{@link module:kss.parse} method of the `kss` module:
 * ```
 * const kss = require('kss');
 * let styleGuide = kss.parse(input, options);
 * ```
 * @private
 * @module kss/lib/parse
 */

const KssStyleGuide = require('./kss_style_guide.js');
const md = require('./md.js');
const path = require('path');

/**
 * Convert colors doc block to a collection of color objects
 *
 * @private
 * @param {String} text paragraph from a comment block.
 * @returns {Array} collection of color objects `{name: '…', color: '…'}`
 */
const parseColors = function(text) {
  // Replace runs of white space with a single space.
  text = text.trim();

  const colors = [];

  // it support every CSS4 colors
  // match color regex: https://regex101.com/r/V2VROM/1/
  // complete regex: https://regex101.com/r/43o75I/3
  const regex = /^(?:(\S+)\s*:\s*)?([a-zA-Z]+|#[0-9a-f]{3}|#(?:[0-9a-f]{2}){2,4}|(?:rgb|hsl)a?\((?:-?\d+%?[,\s]+){2,3}\s*[\d\.]+%?\))(?:\s*-\s*(.*))?$/gmi;

  let test = regex.exec(text);

  while (test !== null) {
    const color = {
      color: test[2]
    };

    if (test[1]) {
      color.name = test[1];
    }

    if (test[3]) {
      color.description = test[3];
    }

    // @TODO: add converted values
    // color.hex = hexToRgb(color.hex);
    // color.rgb = hexToRgb(color.hex);
    // color.hsl = rgbToHsl(color.rgb);

    colors.push(color);

    test = regex.exec(text);
  }

  return colors;
};

/**
 * Convert String to Float
 *
 * @private
 * @param {String} value string of a number
 * @returns {Float} string converted
 */
const toFloat = function(value) {
  return isNaN(value) ? 0 : parseFloat(value);
};

// @TODO: Replace {base, path, contents} with Vinyl.
/**
 * Parse an array/string of documented CSS, or an array of file objects with
 * their content.
 *
 * Each File object in the array should be formatted as:
 * `{ base: "path to source directory", path: "full path to file", contents: "content" }`.
 *
 * @alias module:kss.parse
 * @param {*} input The input to parse
 * @param {Object} [options] Options to alter the output content. Same as the
 *   options in [`traverse()`]{@link module:kss.traverse}.
 * @returns {KssStyleGuide} Returns a `KssStyleGuide` object.
 */
const parse = function(input, options) {
  // Default parsing options.
  options = options || {};
  if (typeof options.markdown === 'undefined') {
    options.markdown = true;
  }
  if (typeof options.header === 'undefined') {
    options.header = true;
  }
  options.custom = options.custom || [];

  // Massage our input into a "files" array of Vinyl-like objects.
  let files = [];
  const styleGuide = {
    files: [],
    sections: []
  };

  // If supplied a string.
  if (typeof input === 'string') {
    files.push({
      contents: input
    });

  // If supplied an array of strings or objects.
  } else {
    files = input.map(file => {
      if (typeof file === 'string') {
        return {contents: file};
      } else {
        styleGuide.files.push(file.path);
        return file;
      }
    });
  }

  for (let file of files) {
    // Retrieve an array of "comment block" strings, and then evaluate each one.
    let comments = findCommentBlocks(file.contents);

    for (let comment of comments) {
      // Create a new, temporary section object with some default values.
      // "raw" is a comment block from the array above.
      let newSection = {
        raw: comment.raw,
        header: '',
        description: '',
        modifiers: [],
        parameters: [],
        markup: '',
        source: {
          // Always display using UNIX separators.
          filename: file.base ? path.relative(file.base, file.path).replace(/\\/g, '/') : file.path,
          path: file.path ? file.path : '',
          line: comment.line
        }
      };

      // Split the comment block into paragraphs.
      let paragraphs = comment.text.split('\n\n');

      // Ignore this block if a style guide reference number is not listed.
      for (let i = 0; i < paragraphs.length; i++) {
        let reference = findReference(paragraphs[i]);
        if (reference) {
          newSection.reference = reference;
          paragraphs.splice(i, 1);
        }
      }

      if (!newSection.reference) {
        continue;
      }

      // Before anything else, process the properties that are clearly labeled
      // and can be found right away and then removed.
      processProperty.call(newSection, paragraphs, 'Colors', parseColors);
      processProperty.call(newSection, paragraphs, 'Markup');
      processProperty.call(newSection, paragraphs, 'Weight', toFloat);
      // Process custom properties.
      for (let customProperty of options.custom) {
        processProperty.call(newSection, paragraphs, customProperty);
      }

      // If the block is just a reference, copy the reference into the header.
      if (paragraphs.length === 0) {
        newSection.header = newSection.reference;

      // If the block has just 1 paragraph, it is just a header and a reference.
      } else if (paragraphs.length === 1) {
        newSection.header = newSection.description = paragraphs[0];

      // If it has 2+ paragraphs, search for modifiers.
      } else {

        // Extract the approximate header, description and modifiers paragraphs.
        // The modifiers will be split into an array of lines.
        newSection.header = paragraphs[0];
        let possibleModifiers = paragraphs.pop();
        newSection.modifiers = possibleModifiers.split('\n');
        newSection.description = paragraphs.join('\n\n');

        // Check the modifiers paragraph. Does it look like it's a list of
        // modifiers, or just another paragraph of the description?
        let numModifierLines = newSection.modifiers.length,
          hasModifiers = true,
          lastModifier = 0;
        for (let j = 0; j < numModifierLines; j += 1) {
          if (newSection.modifiers[j].match(/^\s*.+?\s+\-\s/g)) {
            lastModifier = j;
          } else if (j === 0) {
            // The paragraph doesn't start with a modifier, so bail out.
            hasModifiers = false;
            j = numModifierLines;
          } else {
            // If the current line doesn't match a modifier, it must be a
            // multi-line modifier description.
            newSection.modifiers[lastModifier] += ' ' + newSection.modifiers[j].replace(/^\s+|\s+$/g, '');
            // We will strip this blank line later.
            newSection.modifiers[j] = '';
          }
        }
        // Remove any blank lines added.
        newSection.modifiers = newSection.modifiers.filter(line => { return line !== ''; });

        // If it's a modifiers paragraph, turn each one into a modifiers object.
        if (hasModifiers) {
          // If the section has markup, create KssModifier objects.
          if (newSection.markup) {
            newSection.modifiers = createModifiers(newSection.modifiers, options);
          } else {
            // If the section has no markup, create KssParameter objects.
            newSection.parameters = createParameters(newSection.modifiers, options);
            newSection.modifiers = [];
          }

        // Otherwise, add it back to the description.
        } else {
          newSection.description += '\n\n' + possibleModifiers;
          newSection.modifiers = [];
        }
      }

      // Squash the header into a single line.
      newSection.header = newSection.header.replace(/\n/g, ' ');

      // Check the section's status.
      newSection.deprecated = hasPrefix(newSection.description, 'Deprecated');
      newSection.experimental = hasPrefix(newSection.description, 'Experimental');

      // If a separate header is requested, remove the first paragraph from the
      // description.
      if (options.header) {
        if (newSection.description.match(/\n{2,}/)) {
          newSection.description = newSection.description.replace(/^.*?\n{2,}/, '');
        } else {
          newSection.description = '';
        }
      }

      // Markdown Parsing.
      if (options.markdown) {
        newSection.description = md.render(newSection.description);
      }

      // Add the new section instance to the sections array.
      styleGuide.sections.push(newSection);
    }
  }

  return new KssStyleGuide(styleGuide);
};

/**
 * Returns an array of comment blocks found within a string.
 *
 * @private
 * @param  {String} input The string to search.
 * @returns {Array} An array of blocks found as objects containing line, text,
 *   and raw properties.
 */
const findCommentBlocks = function(input) {
  /* eslint-disable key-spacing */
  const commentRegex = {
    single:        /^\s*\/\/.*$/,
    docblockStart: /^\s*\/\*\*\s*$/,
    multiStart:    /^\s*\/\*+\s*$/,
    multiFinish:   /^\s*\*\/\s*$/
  };
  /* eslint-enable key-spacing */

  // Convert Windows/Mac line endings to Unix ones.
  input = input.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  let blocks = [],
    block = {
      line: 0,
      text: '',
      raw: ''
    },
    indentAmount = false,
    insideSingleBlock = false,
    insideMultiBlock = false,
    insideDocblock = false;

  // Add an empty line to catch any comment at the end of the input.
  input += '\n';
  const lines = input.split('\n');
  for (let i = 0; i < lines.length; i += 1) {
    let line = lines[i];

    // Remove trailing space.
    line = line.replace(/\s*$/, '');

    // Single-line parsing.
    if (!insideMultiBlock && !insideDocblock && line.match(commentRegex.single)) {
      block.raw += line + '\n';
      // Add the current line (and a newline) minus the comment marker.
      block.text += line.replace(/^\s*\/\/\s?/, '') + '\n';
      if (!insideSingleBlock) {
        block.line = i + 1;
      }
      insideSingleBlock = true;
      // Continue to next line.
      continue;
    }

    // If we have reached the end of the current block, save it.
    if (insideSingleBlock || (insideMultiBlock || insideDocblock) && line.match(commentRegex.multiFinish)) {
      let doneWithCurrentLine = !insideSingleBlock;
      block.text = block.text.replace(/^\n+/, '').replace(/\n+$/, '');
      blocks.push(block);
      insideMultiBlock = insideDocblock = insideSingleBlock = indentAmount = false;
      block = {
        line: 0,
        text: '',
        raw: ''
      };
      // If we "found" the end of a single-line comment block, we are not done
      // processing the current line and cannot skip the rest of this loop.
      if (doneWithCurrentLine) {
        continue;
      }
    }

    // Docblock parsing.
    if (line.match(commentRegex.docblockStart)) {
      insideDocblock = true;
      block.raw += line + '\n';
      block.line = i + 1;
      continue;
    }
    if (insideDocblock) {
      block.raw += line + '\n';
      // Add the current line (and a newline) minus the comment marker.
      block.text += line.replace(/^\s*\*\s?/, '') + '\n';
      continue;
    }

    // Multi-line parsing.
    if (line.match(commentRegex.multiStart)) {
      insideMultiBlock = true;
      block.raw += line + '\n';
      block.line = i + 1;
      continue;
    }
    if (insideMultiBlock) {
      block.raw += line + '\n';
      // If this is the first interior line, determine the indentation amount.
      if (indentAmount === false) {
        // Skip initial blank lines.
        if (line === '') {
          continue;
        }
        indentAmount = line.match(/^\s*/)[0];
      }
      // Always strip same indentation amount from each line.
      block.text += line.replace(new RegExp('^' + indentAmount), '', 1) + '\n';
    }
  }

  return blocks;
};

/**
 * Takes an array of modifier lines, and turns it into a JSON equivalent of
 * KssModifier.
 *
 * @private
 * @param {Array} rawModifiers Raw Modifiers, which should all be strings.
 * @param {Object} options The options object.
 * @returns {Array} The modifier instances created.
 */
const createModifiers = function(rawModifiers, options) {
  return rawModifiers.map(entry => {
    // Split modifier name and the description.
    let modifier = entry.split(/\s+\-\s+/, 1)[0];
    let description = entry.replace(modifier, '', 1).replace(/^\s+\-\s+/, '');

    // Markdown parsing.
    if (options.markdown) {
      description = md.renderInline(description);
    }

    return {
      name: modifier,
      description: description
    };
  });
};

/**
 * Takes an array of parameter lines, and turns it into instances of
 * KssParameter.
 *
 * @private
 * @param {Array} rawParameters Raw parameters, which should all be strings.
 * @param {Object} options The options object.
 * @returns {Array} The parameter instances created.
 */
const createParameters = function(rawParameters, options) {
  return rawParameters.map(entry => {
    // Split parameter name and the description.
    let parameter = entry.split(/\s+\-\s+/, 1)[0];
    let defaultValue = '';
    let description = entry.replace(parameter, '', 1).replace(/^\s+\-\s+/, '');

    // Split parameter name and the default value.
    if (/\s+=\s+/.test(parameter)) {
      let tokens = parameter.split(/\s+=\s+/);
      parameter = tokens[0];
      defaultValue = tokens[1];
    }

    // Markdown parsing.
    if (options.markdown) {
      description = md.renderInline(description);
    }

    return {
      name: parameter,
      defaultValue: defaultValue,
      description: description
    };
  });
};

/**
 * Check a section for the reference number it may or may not have.
 *
 * @private
 * @param {Array} text An array of the paragraphs in a single block.
 * @returns {Boolean|String} False if not found, otherwise returns the reference
 *   number as a string.
 */
const findReference = function(text) {
  // Replace runs of white space with a single space.
  text = text.trim().replace(/\s+/g, ' ');

  // Search for the "styleguide" (or "style guide") keyword at the start of the
  // paragraph.
  let regex = /^style\s?guide\s?[-:]?\s?/i;
  if (regex.test(text)) {
    return text.replace(regex, '');
  }
  return false;
};

/**
 * Checks if there is a specific property in the comment block, adds it to
 * `this`, and removes it from the original array of paragraphs.
 *
 * @private
 * @param {Array} paragraphs An array of the paragraphs in a single comment
 *   block.
 * @param {String} propertyName The name of the property to search for.
 * @param {Function} [processValue] A function to massage the value before it is
 *   inserted into `this`.
 */
const processProperty = function(paragraphs, propertyName, processValue) {
  let indexToRemove = false;

  propertyName = propertyName.toLowerCase();

  for (let i = 0; i < paragraphs.length; i++) {
    if (hasPrefix(paragraphs[i], propertyName)) {
      this[propertyName] = paragraphs[i].replace(new RegExp('^\\s*' + propertyName + '\\:\\s+?', 'gmi'), '');
      if (typeof processValue === 'function') {
        this[propertyName] = processValue(this[propertyName]);
      }
      indexToRemove = i;
      break;
    }
  }

  if (indexToRemove !== false) {
    paragraphs.splice(indexToRemove, 1);
  }
};

/**
 * Essentially this function checks if a string is prefixed by a particular
 * attribute, e.g. 'Deprecated:' and 'Markup:'
 *
 * @private
 * @param {String} description The string to check.
 * @param {String} prefix The prefix to search for.
 * @returns {Boolean} Whether the description contains the specified prefix.
 */
const hasPrefix = function(description, prefix) {
  return (new RegExp('^\\s*' + prefix + '\\:', 'gmi')).test(description);
};

module.exports = parse;
