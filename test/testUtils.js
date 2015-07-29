'use strict';

var path = require('path'),
  kss = require('../index.js');

module.exports = {

  fixtures: function(subpath) {
    if (!subpath) {
      subpath = '';
    }
    return path.join(__dirname, 'fixtures', subpath);
  },

  traverseFixtures: function(options, cb) {
    kss.traverse(this.fixtures(), options, function(err, styleguide) {
      err.should.not.be.Error();
      styleguide.data.sections.should.be.ok();
      cb(styleguide);
    });
  }
};
