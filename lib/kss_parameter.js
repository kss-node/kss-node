var KssParameter;

/**
 * An instance of this class is returned on calling `KssSection.parameter`.
 * Exposes convenience methods for interpreting data.
 *
 * @param {Object} data A part of the data object passed on by `KssSection`.
 */
module.exports = KssParameter = function (data) {
	if (!(this instanceof KssParameter)) {
		return new KssParameter();
	}
	this.data = data || {};
	this.init();
};

KssParameter.prototype.init = function () {
};

KssParameter.prototype.section = function() {
	return this.data.section;
};

KssParameter.prototype.name = function() {
	return this.data.name;
};

KssParameter.prototype.description = function() {
	return this.data.description;
};
