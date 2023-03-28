'use strict';

const hljs = require('highlight.js');

module.exports = function(Handlebars) {
  Handlebars.registerHelper('hljs', function(value, lang) {
    lang = lang || 'html';
    try {
      return hljs.highlight(value, {language: lang}).value;
    } catch (e) {
      console.log(e);
    }
  });
};
