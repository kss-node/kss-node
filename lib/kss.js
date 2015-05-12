/*eslint-disable key-spacing*/

'use strict';

/**
 * The core kss API can be imported with:
 * ```
 * var kss = require('kss');
 * ```
 * The various constructors and methods can then be accessed with:
 * ```
 * var kssStyleguide = new kss.KssStyleguide();
 * var kssSection    = new kss.KssSection();
 * var kssModifier   = new kss.KssModifier();
 * var kssParameter  = new kss.KssParameter();
 * kss.parse();
 * kss.traverse();
 * ```
 * @module kss
 */

module.exports = {
  KssStyleguide: require('./kss_styleguide.js'),
  KssSection:    require('./kss_section.js'),
  KssModifier:   require('./kss_modifier.js'),
  KssParameter:  require('./kss_parameter.js'),
  parse:         require('./parse.js'),
  traverse:      require('./traverse.js')
};
