'use strict';

const hljs = require('highlight.js');

module.exports = function(mainTwig) {
  mainTwig.extend((Twig) => {
    Twig.exports.extendFilter('hljs', (value, args) => {
      const lang = args && args[0] ? args[0] : 'html';
      try {
        return hljs.highlight(lang, value, true).value;
      } catch (e) {
        console.log(e);
      }
    });
  });
};
