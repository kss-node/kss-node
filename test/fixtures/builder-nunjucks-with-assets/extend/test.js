'use strict';

module.exports = function(NunjucksEnv) {
  NunjucksEnv.addGlobal('test', () => {
    return 'Nunjucks global loaded into template!';
  });

  NunjucksEnv.addFilter('test', () => {
    return 'Nunjucks filter loaded into template!';
  });
};
