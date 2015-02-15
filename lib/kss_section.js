/**
 * An instance of this class is returned on calling `KssStyleguide.section`.
 * Exposes convenience methods for interpreting data.
 *
 * @param {Object} data A part of the data object passed on by `KssStyleguide`.
 */
module.exports = KssSection = function (data) {
	if (!(this instanceof KssSection)) {
		return new KssSection();
	}
	this.data = data || {};
	this.styleguide = data.styleguide || null;
	this.init();
};

KssSection.prototype.init = function () {
	var self = this;

	if (this.data.modifiers) {
		this.data.modifiers = this.data.modifiers.map(function(modifier) {
			modifier.data.section = self;
			return modifier;
		});
	}
	else {
		this.data.modifiers = [];
	}

	if (this.data.parameters) {
		this.data.parameters = this.data.parameters.map(function(parameter) {
			parameter.data.section = self;
			return parameter;
		});
	}
	else {
		this.data.parameters = [];
	}
};

// Return `KssSection` as a JSON object.
KssSection.prototype.JSON = function (customProperties) {
	var returnObject;

	customProperties = customProperties || [];

	returnObject = {
		header:       this.header(),
		description:  this.description(),
		deprecated:   this.deprecated(),
		experimental: this.experimental(),
		reference:    this.reference(),
		depth:        this.depth(),
		weight:       this.weight(),
		referenceURI: this.referenceURI(),
		markup:       this.markup
	};

	returnObject.modifiers = this.data.modifiers.map(function(modifier) {
		return {
			name: modifier.name(),
			description: modifier.description(),
			className: modifier.className()
		};
	});
	returnObject.parameters = this.data.parameters.map(function(modifier) {
		return {
			name: modifier.name(),
			description: modifier.description()
		};
	});

	// Add custom properties to the JSON object.
	for (var i = 0; i < customProperties.length; i++) {
		if (this.data[customProperties[i]]) {
			returnObject[customProperties[i]] = this.data[customProperties[i]];
		}
	}

	return returnObject;
};

KssSection.prototype.header = function() {
	return this.data.header;
};

KssSection.prototype.description = function() {
	return this.data.description;
};

KssSection.prototype.deprecated = function() {
	return this.data.deprecated;
};

KssSection.prototype.experimental = function() {
	return this.data.experimental;
};

KssSection.prototype.reference = function() {
	return this.data.reference;
};

KssSection.prototype.depth = function() {
	return this.data.depth;
};

KssSection.prototype.weight = function() {
	return this.data.weight ? this.data.weight : 0;
};

KssSection.prototype.encodeReferenceURI = function(reference) {
	return encodeURI(
		reference
			.replace(/\s+\-\s+/g, '-')
			.replace(' ', '-')
			.toLowerCase()
	);
};

KssSection.prototype.referenceURI = function() {
	return this.data.referenceURI;
};

KssSection.prototype.markup = function() {
	return this.data.markup || false;
};

KssSection.prototype.modifiers = function(query) {
	var number, i, l;

	if (typeof query === 'string') {
		number = parseFloat(query, 10);

		// If can be converted to a number, convert and search
		// for the query by index (see below).
		if (number.toString() === query) {
			query = number;
		} else {
			// Otherwise, search for the modifier by name:
			l = this.data.modifiers.length;
			for (i = 0; i < l; i += 1) {
				if (this.data.modifiers[i].data.name === query) {
					return this.data.modifiers[i];
				}
			}
			return false;
		}
	}

	if (typeof query === 'number') {
		return this.data.modifiers.length > query ? this.data.modifiers[query] : false;
	}

	return this.data.modifiers;
};

KssSection.prototype.firstModifier = function() {
	if (this.data.modifiers.length) {
		return this.data.modifiers[0];
	} else {
		return false;
	}
};

KssSection.prototype.parameters = function() {
	return this.data.parameters;
};
