var fs = require('fs'),
    compilerPath = __dirname + '/precompilers/',

  init = function (compilerPath) {
    var precomp = {
      mask: '',
      count: '',
      compilers: {}
    };

    // Read all files from compilerPath
    // fs.readdir(compilerPath, function (err, files) {
    var files = fs.readdirSync(compilerPath);

    for(var i in files) if (files.hasOwnProperty(i)) {

      var filePath = compilerPath + files[i],
          module = require(filePath);

      // If the file is a valid compiler include it
      if (module.name && module.ext && module.render) {

        precomp.compilers[module.ext] = module;
        precomp.mask += '|\\.' + module.ext;
        precomp.count++;

      // Otherwise throw an error
      } else {
        throw new Error('Invalid precompiler: ' + filePath);
      }
    }

    precomp.mask = new RegExp(precomp.mask.substring(1) + '|\\.css');

    return precomp;
  }

module.exports = init(compilerPath)
