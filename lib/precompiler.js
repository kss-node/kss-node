var fs = require('fs'),
    path = require('path'),
    defaultPath = __dirname + '/precompilers/';

function precompiler(compilerPath) {
  var compilerPath = compilerPath || defaultPath
    , precomp = {
      mask: '',
      count: 0,
      compilers: {}
    };

  // Read all files from compilerPath
  var files = fs.readdirSync(compilerPath);

  files.forEach(function(filename) {
    var filePath = path.resolve(compilerPath, filename),
        module = require(filePath);

    if (module.name && module.extensions && module.render) {
      precomp.compilers[module.name] = module;
      precomp.mask += '|*.' + module.extensions.join('|*.');
      precomp.count += 1;
    } else {
      throw new Error('Invalid precompiler: ' + filePath);
    }
  })

  precomp.mask = precomp.mask.slice(1) + '|*.css'

  return precomp
};

module.exports = precompiler;
