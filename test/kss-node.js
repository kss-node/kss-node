var exec = require('child_process').exec,
	path = require('path'),
	assert = require('assert'),
	styleDirectory = path.normalize(__dirname + '/fixtures-styles/'),
	common = require('./common.js')(styleDirectory);

function cleanup() {
	common.rmdir('test-tmp');
};

function kss(args, assertCallback) {
	args.unshift('bin/kss-node');
	console.log(args.join(' '));
	exec(args.join(' '), function(err, stdout, stderr) {
		assertCallback(err, stdout, stderr);
		cleanup();
	});
}

suite('#kss-node', function() {
	suite('No arguments', function() {
		test('Should display help', function(done) {
			kss([], function(err, stdout, stderr) {
				assert.ok(/Usage:/g.test(stderr));
				assert.ok(/Options:/g.test(stderr));
				done();
			});
		});
	});

	suite('load-path option', function() {
		test('Fails when no load path specified', function(done) {
			var args = [
				'test/fixtures-styles/with-include', 'test-tmp',
				'--sass', 'test/fixtures-styles/with-include/style.scss'
			];
			kss(args, function(err, stdout, stderr) {
				assert.ok(/Error during generation/g.test(stdout));
				assert.ok(/error: file to import not found or unreadable: "buttons"/g.test(stdout));
				done();
			});
		});
		test('Succeeds when load path specified', function(done) {
			var args = [
				'test/fixtures-styles/with-include', 'test-tmp',
				'-L', 'test/fixtures-styles/includes',
				'--sass', 'test/fixtures-styles/with-include/style.scss'
			];
			kss(args, function(err, stdout, stderr) {
				assert.ok(/Generation completed successfully/g.test(stdout));
				done();
			});
		});
	});
});
