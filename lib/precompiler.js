var fs = require('fs'),

  preCompiler = function (compilerPath, argv) {
    var precomp = {
      mask:'',
      count:0,
      compilers:{}
    };

    // Read all files from compilerPath
    // fs.readdir(compilerPath, function (err, files) {
    var files = fs.readdirSync(compilerPath);

    for (var i in files) if (files.hasOwnProperty(i)) {

      var filePath = compilerPath + files[i],
        module = require(filePath);

      // If the file is a valid compiler include it
      if (module.name && module.ext && module.render) {

        precomp.compilers[module.ext] = module;
        precomp.count++;

        if (argv[module.ext]) {
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
