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

  sectionQueryArray: function(done, query, options, testFunction) {
    kss.traverse(this.fixtures(), options || {}, function(err, styleguide) {
      err.should.not.be.Error();
      var sections = styleguide.section(query);

      sections.should.be.an.Array('query did not return an array');
      sections.length.should.not.be.equal(0, 'query returned empty array');
      testFunction(sections);
      done();
    });
  },

  traverseFixtures: function(options, cb) {
    kss.traverse(this.fixtures(), options, function(err, styleguide) {
      err.should.not.be.Error();
      styleguide.data.sections.should.be.ok();
      cb(styleguide);
    });
  }
};
