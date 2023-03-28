'use strict';

const hljs = require('highlight.js');

module.exports = function(nunjucks) {
  nunjucks.addFilter('hljs', (value, lang) => {
    lang = lang || 'html';
    try {
      return hljs.highlight(value, {language: lang}).value;
    } catch (e) {
      console.log(e);
    }
  });
};
