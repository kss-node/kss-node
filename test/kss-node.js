var exec = require('child_process').exec,
	path = require('path'),
	assert = require('assert');

suite('Command Line Interface', function() {
	suite('No arguments', function() {
		test('Should display help', function(done) {
			exec('bin/kss-node', function(err, stdout, stderr) {
				assert.ok(/Usage:/g.test(stderr));
				assert.ok(/Options:/g.test(stderr));
				done();
			});
		});
	});

	suite('Option: --load-path', function() {
		test('Fails without load-path, when using --sass', function(done) {
			exec('bin/kss-node test/fixtures-styles/with-include test/output --sass test/fixtures-styles/with-include/style.scss', function(err, stdout, stderr) {
				assert.ok(/Error during generation/g.test(stdout));
				assert.ok(/error: file to import not found or unreadable: "buttons"/g.test(stdout));
				done();
			});
		});
		test('Succeeds with load-path, when using --sass', function(done) {
			exec('bin/kss-node test/fixtures-styles/with-include test/output -L test/fixtures-styles/includes --sass test/fixtures-styles/with-include/style.scss', function(err, stdout, stderr) {
				assert.ok(/Generation completed successfully/g.test(stdout));
				done();
			});
		});
	});

	suite('Option: --helpers', function() {
		test('Should load additional Handlerbars helpers', function(done) {
		  // @TODO: Doing a "cat" of the output file seems inelegant.
			exec('bin/kss-node test/fixtures-styles/with-include test/output --template test/fixtures-styles/template --helpers test/fixtures-styles/template/helpers; cat test/output/index.html', function(err, stdout, stderr) {
				assert.ok(/The file containing the Handlebars helper was loaded\./g.test(stdout));
				assert.ok(/Handlerbars helper loaded into template!/g.test(stdout));
				done();
			});
		});
	});
});
