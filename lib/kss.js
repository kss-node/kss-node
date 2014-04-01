/*jslint continue:true */

var walk = require('./walk.js'),
	KssSection = require('./kss_section.js'),
	KssStyleguide = require('./kss_styleguide.js'),
	KssModifier = require('./kss_modifier.js'),
	precompilers = require('./precompiler')(),
	path = require('path'),
	fs = require('fs'),
	util = require('util'),
	marked = require('marked'),
	natural = require('natural'),
	traverse, parse, parseChunk, checkReference, findBlocks, processMarkup,
	isDeprecated, isExperimental, hasPrefix,
	commentExpressions = {
		single: /\s*?\/\/(.*?)$/g,
		multiStart: /\/\*\!?(.*?)$/,
		multiFinish: /\*\//,
		multiBeforeFinish: /(.*?)\*\//
	};

/**
 * Parse a whole directory and its contents.
 * Callback returns an instance of `KssStyleguide`
 * @param  {String}   directory The directory to traverse
 * @param  {Object}   options   Options to alter the output content
 * @param  {Function} callback  Called when traversal AND parsing is complete
 */
traverse = function(directory, options, callback) {
	var self = this, files = [], fileCounter = 0;

	options = options || {};
	if (typeof options === 'function') {
		callback = options;
		options = {};
	}
	if (typeof callback === 'undefined') {
		throw new Error('No callback supplied for KSS.traverse!');
	}

	// Mask to search for particular file types - defaults to precompiler masks,
	// or CSS and LESS only.
	options.mask = options.mask || precompilers.mask || /\.css|\.less/;


	// If the mask is a string, convert it into a RegExp
	if (!(options.mask instanceof RegExp)) {
		options.mask = new RegExp(
			'(?:' + options.mask.replace(/\*/g, '.*') + ')$'
		);
	}

	// Get each file in the target directory, order them alphabetically and then
	// parse their output.
	walk(path.normalize(directory), options, {
		file: function(file) {
			file = file.replace(/\\/g, '/');
			files.push(file);
			fileCounter += 1;
		},
		finished: function(err) {
			var i, l = files.length, fileContents = [], orderedObject = {};
			files.sort();
			for (i = 0; i < l; i += 1) {
				(function(j){
					fs.readFile(files[j], 'utf8', function(err, contents) {
						if (err) { callback(err); return; }

						fileContents[j] = contents;
						fileCounter -= 1;

						if (fileCounter === 0) {
							fileContents.map(function(contents, index) {
								var filename = files[index];
								orderedObject[filename] = contents;
								return '';
							});
							parse(orderedObject, options, callback);
						}
					});
				}(i));
			}
		}
	});
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
 * @param  {Mixed}    input    The input to parse
 * @param  {Object}   options  Options to alter the output content. Inherited from `traverse`.
 * @param  {Function} callback Called when parsing is complete
 */
parse = function(input, options, callback) {
	var data = {}, fileName, files, currentObject,
		i, l;

	// If supplied a string, just make it an Array.
	if (typeof input === 'string') {
		input = [input];
	}

	// Otherwise assume the input supplied is a JSON object, as
	// specified above.
	if (!Array.isArray(input)) {
		files = input;
		input = [];
		data.files = [];
		for (fileName in files) {
			input.push(files[fileName]);
			data.files.push(fileName);
		}
		data.files.sort();
	}

	// Default parsing options
	if ("undefined" === typeof options.markdown) {
		options.markdown = true;
	}
	if ("undefined" === typeof options.multiline) {
		options.multiline = true;
	}
	options.typos = options.typos || false;

	// Actually parse the input (parseChunk is
	// the key function here).
	l = input.length;
	data.sections = [];
	data.section_refs = [];

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
 * @param  {Object} data    JSON object containing all of the styleguide data.
 * @param  {String} input   Text to be parsed, i.e. a single CSS/LESS/etc. file's content.
 * @param  {Object} options The options passed on from `traverse` or `parse`
 * @return {Object}
 */
parseChunk = function(data, input, options) {
	var currSection, i, l, blocks = [], paragraphs, j, m, allModifiers;

	// Append the raw text to the body string
	data.body = data.body || '';
	data.body += '\n\n';
	data.body += input;

	// Retrieve an array of "comment block" strings, and then evaluate each one
	blocks = findBlocks(input, options);
	l = blocks.length;

	for (i = 0; i < l; i += 1) {

		// Create a new, temporary section object with some default values.
		// "raw" is a comment block from the array above.
		currSection = {
			raw: blocks[i],
			header: "",
			description: "",
			modifiers: [],
			markup: false
		};

		// Split the comment block into paragraphs
		paragraphs = currSection.raw
			.replace(/\n\r|\r\n/g, '\n') // Handle Standard Line Breaks
			.replace(/\r/g, '\n')        // Any remaining \r characters too.
			.replace(/^\s+|\s+$/, '', 0) // Trim the string of white space.
			.split('\n\n');

		// Before anything else, process the "markup" paragraph.
		// It's labelled so can be found right away and then removed
		currSection = processMarkup(paragraphs, options, currSection);

		// Then check for a styleguide reference number. If not listed, ignore this block!
		currSection.reference = checkReference(paragraphs, options) || '';
		if (!currSection.reference) {
			continue;
		}
		currSection.refDepth = currSection.reference ? currSection.reference.split(/\./g).length : false;


		// If the block is 2 paragraphs long, it may still be a reference and should be
		// checked just in case. If it's 3+ long, it's most likely a styleguide reference
		// and needs evaluating.
		if (paragraphs.length === 2) {
			currSection.header = currSection.description = paragraphs[0];
		} else
		if (paragraphs.length > 2) {

			// Extract the approximate header, description and modifiers paragraphs.
			// The modifiers will be split into an array of lines.
			currSection.header = paragraphs[0];
			currSection.description = paragraphs.slice(0, paragraphs.length - 2).join('\n\n');
			currSection.modifiers = paragraphs[paragraphs.length - 2]
				.replace(/\n\r|\r\n/g, '\n')
				.replace(/\r/g, '\n')
				.split('\n');

			// Check the modifiers paragraph. Does it look like it's a list of modifiers,
			// or just another paragraph of the description?
			m = currSection.modifiers.length;
			allModifiers = true;
			for (j = 0; j < m; j += 1) {
				if (!currSection.modifiers[j].match(/[#:.a-zA-Z\-]*\s*\-\s/g)) {
					allModifiers = false;
				}
			}

			// If it's not a modifiers paragraph, add it back to the description.
			// Otherwise, turn each one into a modifiers object.
			if (!allModifiers) {
				currSection.description += '\n\n';
				currSection.description += currSection.modifiers.join('\n');
				currSection.modifiers = [];
			} else {
				currSection.modifiers = createModifiers(currSection.modifiers, options);
			}
		}

		// Squash the header into a single line.
		currSection.header = currSection.header.replace(/\n/g, ' ');

		// Check the section's status
		currSection.deprecated = isDeprecated(currSection.description, options);
		currSection.experimental = isExperimental(currSection.description, options);

		// Compress any white space in the description
		if (options.multiline) {
			if (currSection.description.match(/\n{2,}/)) {
				currSection.description = currSection.description.replace(/.*?\n+/, '');
			} else {
				currSection.description = '';
			}
		}

		// Markdown Parsing
		if (options.markdown) {
			currSection.description = marked(currSection.description);
		}

		// Add the new section instance to the sections array
		currSection = new KssSection(currSection);
		data.sections.push(currSection);

		// Store the reference for quick searching later, if it's supplied
		if (currSection.data.reference) {
			data.section_refs[currSection.data.reference] = currSection;
		}
	}

	return data;
};

/**
 * Takes an array of modifier lines, and turns it into instances of KssModifier
 * @param  {Array}  lines   Modifier lines, which should all be strings.
 * @param  {Object} options Any options passed on by the functions above.
 * @return {Array} The modifier instances created.
 */
createModifiers = function(lines, options) {
	return lines.map(function(entry) {
		var modifier, description, className, markup = '';

		// Split modifier name and the description
		modifier = entry.split(/\s+\-\s+/, 1)[0];
		description = entry.replace(modifier, '', 1).replace(/^\s+\-\s+/, '');

		className = modifier.replace(/\:/, '.pseudo-class-');

		// Markdown parsing
		if (options.markdown) {
			description = marked(description);
		}

		return new KssModifier({
			name: modifier,
			description: description,
			className: className
		});
	});
};

/**
 * Returns an array of comment blocks found within a string.
 * @param  {String} input   The string to search.
 * @param  {Object} options Optional parameters to pass. Inherited from `parse`.
 * @return {Array} The blocks found.
 */
findBlocks = function(input, options) {
	var currentBlock = '', insideSingleBlock = false, insideMultiBlock = false,
		isSingle = true, isMultiStart = true,
		blocks = [],
		lines, line, i, l;

	options = options || {};

	input = input.replace(/\n\r|\r\n/g, '\n').replace(/\r/g, '\n');
	lines = input.split(/\n|$/g);

	l = lines.length;
	for (i = 0; i < l; i += 1) {
		line = lines[i];

		isSingle = line.match(commentExpressions.single);
		isMultiStart = line.match(commentExpressions.multiStart);

		// Multi-line parsing
		if (!insideSingleBlock && isMultiStart) {
			currentBlock = isMultiStart[1] || '';
			insideMultiBlock = true;
			continue;
		}

		if (!insideSingleBlock && insideMultiBlock) {
			if (line.match(commentExpressions.multiFinish)) {

				blocks.push(currentBlock);
				currentBlock = '';
				insideMultiBlock = false;
			} else {
				currentBlock += '\n';
				currentBlock += line;
			}
			continue;
		}

		// Single-line parsing
		if (insideSingleBlock) {
			if (isSingle) {
				currentBlock += '\n';
				currentBlock += line.replace(/\s*?\/\/([ ]{0,1}|\t)/, '');
			} else {
				blocks.push(currentBlock);
				insideSingleBlock = false;
				currentBlock = '';
			}
			continue;
		}

		if (isSingle) {
			currentBlock += line.replace(/\s*?\/\/([ ]{0,1}|\t)/, '');
			insideSingleBlock = true;
			continue;
		}
	}

	// If the comment line is the last, won't finish
	// parsing ordinarily
	if (currentBlock) {
		blocks.push(currentBlock);
	}

	return blocks;
};

/**
 * Check a section for the reference number it may or may not have.
 * @param  {Array}  paragraphs An array of the paragraphs in a single block.
 * @param  {Object} options    The options object passed on from the initial functions
 * @return {Boolean|String} False if not found, otherwise returns the reference number as a string.
 */
checkReference = function(paragraphs, options) {
	var paragraph = paragraphs[paragraphs.length - 1],
		words = paragraph.match(/\s*?[a-zA-Z\-]+/g),
		styleWord,
		numbers;

	options = options || {};

	if (words && words[0].toLowerCase() === 'styleguide') {
		numbers = paragraph.match(/styleguide\s*([0-9\.]*)/i);
		if (numbers[1]) {
			return numbers[1].replace(/^\.|\.$|(\.0){1,}$/g, ''); // Removes trailing 0's and .'s
		}
	}
	if (options.typos) {
		styleWord = words.join('').replace(/\-|\s*/g, '');

		if (natural.Metaphone.compare('Styleguide', styleWord)) {
			numbers = paragraph.match(/[0-9\.]+/g);
			if (numbers[0]) {
				return numbers[0].replace(/^\.|\.$|(\.0){1,}$/g, ''); // Removes trailing 0's and .'s
			}
		}
	}

	return false;
};

/**
 * Checks if there is any markup listed in the comment block and removes it from the original array.
 * @param  {Array}  paragraphs  An array of the paragraphs in a single block
 * @param  {Object} options     The options object passed on from the initial functions
 * @param  {Object} sectionData The original data object of a section.
 * @return {Object} A new data object for the section.
 */
processMarkup = function(paragraphs, options, sectionData) {
	var removeIndex = 'nope';

	paragraphs.map(function(paragraph, index) {
		if (hasPrefix(paragraph, options, 'Markup')) {
			sectionData.markup = paragraph.replace(/^\s*?[a-z ]+\:\s+?/i, '');
			paragraph = '';
			removeIndex = index;
		}
		return paragraph;
	});

	if (removeIndex !== 'nope') {
		paragraphs.splice(removeIndex, 1);
	}

	return sectionData;
};

/**
 * Check if the description indicates that a section is deprecated.
 * @param  {String}  description The description of that section
 * @param  {Object}  options     The options passed on from previous functions
 * @return {Boolean}
 */
isDeprecated = function(description, options) {
	return hasPrefix(description, options, 'Deprecated');
};

/**
 * Check if the description indicates that a section is experimental.
 * @param  {String}  description The description of that section
 * @param  {Object}  options     The options passed on from previous functions
 * @return {Boolean}
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
 * @param  {String}  description The string to check
 * @param  {Object}  options     The options passed on from previous functions
 * @param  {String}  prefix      The prefix to search for
 * @return {Boolean}
 */
hasPrefix = function(description, options, prefix) {
	var words;
	if (!options.typos) {
		return !!description.match(new RegExp('^\\s*?' + prefix + '\\:', 'gmi'));
	}

	words = description.replace(/^\s*/, '').match(/^\s*?([a-z ]*)\:/gmi);
	if (!words) {
		return false;
	}

	return natural.Metaphone.compare(words[0].replace(':', ''), prefix);
};


module.exports = {
	parse: parse,
	traverse: traverse,
	KssStyleguide: KssStyleguide,
	KssSection: KssSection,
	KssModifier: KssModifier,
	precompilers: precompilers
};
