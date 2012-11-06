var fs = require('fs'),

  preCompiler = function (compilerPath, argv) {
    var i,
      files = fs.readdirSync(compilerPath),
      precomp = {
        mask: '',
        count: 0,
        compilers: {}
      };

    for (i in files) {
      if (!files.hasOwnProperty(i)) {
        continue;
      }

      var filePath = compilerPath + files[i],
        module = require(filePath);

      // If the file is a valid compiler include it
      if (module.name && module.ext && module.render) {
        precomp.compilers[module.ext] = module;
        precomp.count++;

        if (argv && argv[module.ext]) {
          precomp.mask = '|\\.' + module.ext;
          break;
        }

        precomp.mask += '|\\.' + module.ext;
      } else {
        // Otherwise throw an error
        throw new Error('Invalid precompiler: ' + filePath);
      }
    }

    precomp.mask = new RegExp(precomp.mask.substring(1) + '|\\.css');

    return precomp;
  }

module.exports = {get:preCompiler};
