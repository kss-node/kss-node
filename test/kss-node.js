var exec = require('child_process').exec,
	fs = require('fs'),
	path = require('path'),
	assert = require('assert'),
	styleDirectory = path.normalize(__dirname + '/fixtures-styles/'),
	common = require('./common.js')(styleDirectory);

var data, args;

function cleanup() {
	common.rmdir('test-tmp');
};

function kss(args, done, assertCallback) {
	args.unshift('bin/kss-node');
	console.log(args.join(' '));
	exec(args.join(' '), function(err, stdout, stderr) {
		assertCallback(err, stdout, stderr);
		cleanup();
		done();
	});
}

suite('#kss-node', function() {
	suite('No arguments', function() {
		test('Should display help', function(done) {
			kss([], done, function(err, stdout, stderr) {
				assert.ok(/Usage:/g.test(stderr));
				assert.ok(/Options:/g.test(stderr));
			});
		});
	});

	suite('--load-path option', function() {
		test('Fails when no load path specified', function(done) {
			args = [
				'test/fixtures-styles/with-include', 'test-tmp',
				'--sass', 'test/fixtures-styles/with-include/style.scss'
			];
			kss(args, done, function(err, stdout, stderr) {
				assert.ok(/Error during generation/g.test(stdout));
				assert.ok(/error: file to import not found or unreadable: "buttons"/g.test(stdout));
			});
		});
		test('Succeeds when load path specified', function(done) {
			args = [
				'test/fixtures-styles/with-include', 'test-tmp',
				'-L', 'test/fixtures-styles/includes',
				'--sass', 'test/fixtures-styles/with-include/style.scss'
			];
			kss(args, done, function(err, stdout, stderr) {
				assert.ok(/Generation completed successfully/g.test(stdout));
			});
		});
	});

	suite('--style option', function() {
		test('Works with different files', function(done) {
			args = [
				'test/fixtures-styles/with-include', 'test-tmp',
				'--style', 'test/fixtures-styles/includes/nav.css',
				'--style', 'test/fixtures-styles/includes/buttons.scss'
			];
			kss(args, done, function(err, stdout, stderr) {
				assert.ok(/Generation completed successfully/g.test(stdout));

				data = fs.readFileSync('test-tmp/public/style.css', 'utf8')
				assert.ok(/.nav/g.test(data));
				assert.ok(/.button/g.test(data));
			});
		});
	});

	suite('including other files', function() {
		test('Includes files with pass-thru compiler (css + js)', function(done) {
			args = [
				'test/fixtures-styles/with-include', 'test-tmp',
				'--js', 'test/fixtures-styles/includes/buttons.js',
				'--css', 'test/fixtures-styles/includes/buttons.css'
			];
			kss(args, done, function(err, stdout, stderr) {
				assert.ok(/Generation completed successfully/g.test(stdout), 'Not successful!');

				data = fs.readFileSync('test-tmp/public/style.css', 'utf8')
				assert.ok(/.button/g.test(data));

				data = fs.readFileSync('test-tmp/public/script.js', 'utf8')
				assert.ok(/button/g.test(data));
			});
		});
	});
});
