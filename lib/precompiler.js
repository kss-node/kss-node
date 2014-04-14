var fs = require('fs'),
    path = require('path'),
    defaultPath = __dirname + '/precompilers/';

function precompiler(compilerPath) {
  var compilerPath = compilerPath || defaultPath
    , mask = []
    , extensions
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
      precomp.count += 1;
      if (module.type == 'style'){
        extensions = module.extensions.map(function(ext){
          return '*.' + ext;
        });
        mask = mask.concat(extensions);
      }
    } else {
      throw new Error('Invalid precompiler: ' + filePath);
    }
  })
  precomp.mask = mask.join('|');
  return precomp;
};

module.exports = precompiler;
