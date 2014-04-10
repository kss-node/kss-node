var exec = require('child_process').exec,
	path = require('path'),
	assert = require('assert');

suite('#kss-node', function() {
	suite('No arguments', function() {
		test('Should display help', function(done) {
			exec('bin/kss-node', function(err, stdout, stderr) {
				assert.ok(/Usage:/g.test(stderr));
				assert.ok(/Options:/g.test(stderr));
				done();
			});
		});
	});

	suite('load-path option', function() {
		test('Fails when no load path specified', function(done) {
			exec('bin/kss-node test/fixtures-styles/with-include test-tmp --sass test/fixtures-styles/with-include/style.scss', function(err, stdout, stderr) {
				assert.ok(/Error during generation/g.test(stdout));
				assert.ok(/error: file to import not found or unreadable: "buttons"/g.test(stdout));
				done();
			});
		});
		test('Succeeds when load path specified', function(done) {
			exec('bin/kss-node test/fixtures-styles/with-include test-tmp -L test/fixtures-styles/includes --sass test/fixtures-styles/with-include/style.scss', function(err, stdout, stderr) {
				assert.ok(/Generation completed successfully/g.test(stdout));
				done();
			});
		});
	});
});
