var KssModifier;

/**
 * An instance of this class is returned on calling `KssSection.modifier`.
 * Exposes convenience methods for interpreting data.
 * 
 * @param {Object} data A part of the data object passed on by `KssSection`.
 */
module.exports = KssModifier = function (data) {
	if (!(this instanceof KssModifier)) {
		return new KssModifier();
	}
	this.data = data || {};
	this.data.markup = this.data.markup || '';
	this.init();
};

KssModifier.prototype.init = function () {

};

KssModifier.prototype.section = function() {
	return this.data.section;
};

KssModifier.prototype.name = function() {
	return this.data.name;
};

KssModifier.prototype.description = function() {
	return this.data.description;
};

KssModifier.prototype.className = function() {
	var className = this.data.className;
	
	// Only get the first class combination - 
	// Markup should not be multiple elements deep at this stage.
	className = className.split(/\s/);
	if (!className) {
		return false;
	}

	// Split into space-separated classes for inclusion
	// in templates etc.
	className = className[0]
		.replace(/\./g, ' ')
		.replace(/^\s*/g, '');

	return className;
};

KssModifier.prototype.markup = function() {
	if (!(this.data.section && this.data.section.markup)) {
		return false;
	}

	return (this.data.section.markup() || '').replace(/\{\$modifiers\}/g, this.className());
};