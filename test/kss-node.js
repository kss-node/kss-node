var exec = require('child_process').exec,
  path = require('path'),
  assert = require('assert');

suite('Command Line Interface', function() {
  suite('No arguments', function() {
    test('Should display help', function(done) {
      exec('bin/kss-node', function(err, stdout, stderr) {
        assert.ok(/Usage:/g.test(stderr), 'Display usage');
        assert.ok(/Options:/g.test(stderr), 'Display options');
        done();
      });
    });
  });

  suite('Option: --source', function() {
    test('Should read source directory from option', function(done) {
      exec('bin/kss-node --source test/fixtures-styles/with-include --destination test/output', function(err, stdout, stderr) {
        assert.ok(/\* KSS Source  : .+test\/fixtures\-styles\/with\-include/g.test(stdout), 'Read --source option');
        assert.strictEqual(/no styleguide overview generated/g.test(stdout), false, 'Styleguide homepage not generated from empty file');
        done();
      });
    });
    test('Should not declare success if source directory is empty', function(done) {
      exec('bin/kss-node --source test/fixtures-styles/empty-source --destination test/output', function(err, stdout, stderr) {
        assert.ok(/\* KSS Source  : .+test\/fixtures\-styles\/empty\-source/g.test(stdout), 'Read --source option');
        assert.strictEqual(/Generation completed successfully/g.test(stdout), false, 'Success incorrectly declared');
        assert.ok(/No KSS documentation discovered in source files./g.test(stdout), 'Warning about no KSS docs given');
        done();
      });
    });
    test('Warn if homepage content is not found', function(done) {
      exec('bin/kss-node --source test/fixtures-styles/missing-homepage --destination test/output', function(err, stdout, stderr) {
        assert.ok(/no homepage content found/g.test(stdout), 'Warning about no homepage content found');
        assert.strictEqual(/no styleguide overview generated/g.test(stdout), false, 'Styleguide homepage not generated from missing file');
        done();
      });
    });
    test('Should read multiple source directories from option', function(done) {
      exec('bin/kss-node --source test/fixtures-styles/with-include --source test/fixtures-styles/empty-source --destination test/output', function(err, stdout, stderr) {
        assert.ok(/\* KSS Source  : .+test\/fixtures\-styles\/with\-include, .+test\/fixtures\-styles\/empty\-source/g.test(stdout), 'Read multiple --source options');
        assert.strictEqual(/Generation completed successfully/g.test(stdout), true, 'Styleguide generated from multiple sources');
        done();
      });
    });
  });

  suite('Option: --destination', function() {
    test('Should read destination directory from option', function(done) {
      exec('bin/kss-node test/fixtures-styles/with-include --destination test/output', function(err, stdout, stderr) {
        assert.ok(/\* Destination : .+test\/output/g.test(stdout), 'Read --destination option');
        done();
      });
    });
  });

  suite('Option: --custom', function() {
    test('Should read custom properties from option', function(done) {
      exec('rm -r test/output; bin/kss-node test/fixtures-styles/with-include test/output --template test/fixtures-styles/template --custom custom --custom custom2; cat test/output/section-4.html', function(err, stdout, stderr) {
        assert.ok(/"custom" property: This is the first custom property\./g.test(stdout), 'Read --custom option');
        assert.ok(/"custom2" property: This is the second custom property\./g.test(stdout), 'Read second --custom option');
        done();
      });
    });
  });

  suite('Option: --config', function() {
    test('Should load configuration from json file', function(done) {
      exec('bin/kss-node --config test/cli-option-config.json', function(err, stdout, stderr) {
        assert.ok(/Generation completed successfully/g.test(stdout), 'Read --config option');
        done();
      });
    });
  });

  suite('Handlebars helper', function() {
    // @TODO: Doing a "cat" of the output file seems inelegant.
    test('Should load additional Handlerbars helpers with --helpers option', function(done) {
      exec('rm -r test/output; bin/kss-node test/fixtures-styles/with-include test/output --template test/fixtures-styles/template --helpers test/fixtures-styles/template/helpers; cat test/output/index.html', function(err, stdout, stderr) {
        assert.ok(/The file containing the Handlebars helper was loaded\./g.test(stdout), 'Handlebars helpers js file read');
        assert.ok(/Handlerbars helper loaded into template!/g.test(stdout), 'Handlebars helpers loaded');
        done();
      });
    });
    test('Should load Handlerbars helper: {{section [arg]}}', function(done) {
      exec('cat test/output/section-3.html', function(err, stdout, stderr) {
        assert.ok(/Handlebars Section Helper Test 3/g.test(stdout), 'test 1');
        assert.ok(/Section 3 has been successfully loaded\./g.test(stdout), 'test 2');
        done();
      });
    });
    test('Should load Handlerbars helper: {{eachSection [arg]}}', function(done) {
      exec('cat test/output/section-2.html', function(err, stdout, stderr) {
        assert.ok(/Handlebars eachSection Helper Test 2.1.3/g.test(stdout), 'test 1');
        assert.ok(/Handlebars eachSection Helper Test 2.1.4/g.test(stdout), 'test 2');
        done();
      });
    });
    test('Should load Handlerbars helper: {{eachRoot}}', function(done) {
      exec('cat test/output/index.html', function(err, stdout, stderr) {
        assert.ok(/Handlebars eachRoot Helper Test 2/g.test(stdout), 'test 1');
        assert.ok(/Handlebars eachRoot Helper Test 3/g.test(stdout), 'test 2');
        assert.strictEqual(/Handlebars eachRoot Helper Test 2.1.3/g.test(stdout), false, 'test 3');
        done();
      });
    });
    test('Should load Handlerbars helper: {{ifDepth [arg]}}', function(done) {
      exec('cat test/output/section-2.html', function(err, stdout, stderr) {
        assert.ok(/Handlebars ifDepth Helper Test 2.1</g.test(stdout), 'test 1');
        assert.strictEqual(/Handlebars ifDepth Helper Test 2.1.3</g.test(stdout), false, 'test 2');
        done();
      });
    });
    test('Should load Handlerbars helper: {{unlessDepth [arg]}}', function(done) {
      exec('cat test/output/section-2.html', function(err, stdout, stderr) {
        assert.ok(/Handlebars unlessDepth Helper Test 2.1.3</g.test(stdout), 'test 1');
        assert.strictEqual(/Handlebars unlessDepth Helper Test 2.1</g.test(stdout), false, 'test 2');
        done();
      });
    });
    test('Should load Handlerbars helper: {{eachModifier}}', function(done) {
      exec('cat test/output/section-2.html', function(err, stdout, stderr) {
        assert.ok(/Handlebars eachModifier Helper: :hover/g.test(stdout), 'test 1');
        assert.ok(/Handlebars eachModifier Helper: \.stars\-given</g.test(stdout), 'test 2');
        assert.ok(/Handlebars eachModifier Helper: \.stars\-given:hover/g.test(stdout), 'test 3');
        assert.ok(/Handlebars eachModifier Helper: \.disabled/g.test(stdout), 'test 4');
        done();
      });
    });
    test('Should load Handlerbars helper: {{{markup}}}', function(done) {
      exec('cat test/output/section-2.html', function(err, stdout, stderr) {
        assert.ok(/Handlebars markup Helper: pseudo\-class\-hover/g.test(stdout), 'test 1');
        assert.ok(/Handlebars markup Helper: stars\-given</g.test(stdout), 'test 2');
        assert.ok(/Handlebars markup Helper: stars\-given pseudo\-class\-hover/g.test(stdout), 'test 3');
        assert.ok(/Handlebars markup Helper: disabled/g.test(stdout), 'test 4');
        assert.ok(/Nested Handlerbars partial part 1:part 2 of Nested Handlerbars partial/g.test(stdout), 'test 5');
        assert.ok(/Test of Handlerbars partial data/g.test(stdout), 'test 6');
        done();
      });
    });
  });
});
