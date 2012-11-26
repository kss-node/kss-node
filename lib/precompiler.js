var fs = require('fs'),
    path = require('path'),
    compilerPath = __dirname + '/precompilers/';

var precomp = {
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
    precomp.mask += '|\\.'
    precomp.mask += module.extensions.join('|\\.');
    precomp.count += 1;
  } else {
    throw new Error('Invalid precompiler: ' + filePath);
  }
})

precomp.mask = new RegExp(precomp.mask.substring(1) + '|\\.css');

module.exports = precomp;
