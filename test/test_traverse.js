/* eslint-disable max-nested-callbacks */

'use strict';

const Promise = require('bluebird');

const fs = Promise.promisifyAll(require('fs-extra'));

describe('kss.traverse()', function() {
  describe('API validation checks', function() {
    it('should function without options', function() {
      return kss.traverse(helperUtils.fixtures()).then(styleGuide => {
        expect(styleGuide.meta.files).to.have.length(22);
      }, error => {
        expect(error).to.not.exist;
      });
    });

    it('should function with options', function() {
      return kss.traverse(helperUtils.fixtures(), {}).then(styleGuide => {
        expect(styleGuide.meta.files).to.have.length(22);
      }, error => {
        expect(error).to.not.exist;
      });
    });

    it('should function with an array of directories given', function() {
      return kss.traverse([helperUtils.fixtures('with-include'), helperUtils.fixtures('missing-homepage')], {}).then(styleGuide => {
        expect(styleGuide.meta.files).to.have.length(2);
      }, error => {
        expect(error).to.not.exist;
      });
    });
  });

  context('given options', function() {
    describe('.mask:', function() {
      describe('default mask', function() {
        before(function() {
          // Create an empty directory.
          return fs.removeAsync(helperUtils.fixtures('traverse-directories/empty')).then(() => {
            return fs.mkdirsAsync(helperUtils.fixtures('traverse-directories/empty')).then(() => {
              // Ignore errors.
              return Promise.resolve();
            });
          // Traverse all test fixtures.
          }).then(() => {
            return helperUtils.traverseFixtures({});
          }).then(styleGuide => {
            this.styleGuide = styleGuide;
          });
        });
        after(function() {
          // Remove the empty directory.
          return fs.removeAsync(helperUtils.fixtures('traverse-directories/empty'));
        });

        it('should ignore .svn directory', function(done) {
          expect(this.styleGuide).to.not.containFixture('traverse-directories/.svn/to-be-ignored.scss');
          done();
        });
        it('should find file file-type.css', function(done) {
          expect(this.styleGuide).to.containFixture('file-type.css');
          done();
        });
        it('should find file file-type.less', function(done) {
          expect(this.styleGuide).to.containFixture('file-type.less');
          done();
        });
        it('should find file file-type.stylus', function(done) {
          expect(this.styleGuide).to.containFixture('file-type.stylus');
          done();
        });
        it('should find file file-type.styl', function(done) {
          expect(this.styleGuide).to.containFixture('file-type.styl');
          done();
        });
        it('should find file file-type.sass', function(done) {
          expect(this.styleGuide).to.containFixture('file-type.sass');
          done();
        });
        it('should find file file-type.scss', function(done) {
          expect(this.styleGuide).to.containFixture('file-type.scss');
          done();
        });
        it('should find file includes/buttons.less', function(done) {
          expect(this.styleGuide).to.containFixture('includes/buttons.less');
          done();
        });
        it('should not find file includes/buttons.js', function(done) {
          expect(this.styleGuide).to.not.containFixture('includes/buttons.js');
          done();
        });
      });

      describe('/\\.js/ (regex)', function() {
        before(function() {
          return helperUtils.traverseFixtures({mask: /\.js/}).then(styleGuide => {
            this.styleGuide = styleGuide;
          });
        });

        it('should find file includes/buttons.js', function(done) {
          expect(this.styleGuide).to.containFixture('includes/buttons.js');
          done();
        });
        it('should find file includes/buttons.less', function(done) {
          expect(this.styleGuide).to.not.containFixture('includes/buttons.less');
          done();
        });
        it('should find file style.css', function(done) {
          expect(this.styleGuide).to.not.containFixture('file-type.css');
          done();
        });
      });

      describe("'*.js' (string)", function() {
        before(function() {
          return helperUtils.traverseFixtures({mask: '*.js'}).then(styleGuide => {
            this.styleGuide = styleGuide;
          });
        });

        it('should find file includes/buttons.js', function(done) {
          expect(this.styleGuide).to.containFixture('includes/buttons.js');
          done();
        });
        it('should find file includes/buttons.less', function(done) {
          expect(this.styleGuide).to.not.containFixture('includes/buttons.less');
          done();
        });
        it('should find file style.css', function(done) {
          expect(this.styleGuide).to.not.containFixture('file-type.css');
          done();
        });
      });

      describe('/\.js|\.less|\.css/ (regex)', function() {
        before(function() {
          return helperUtils.traverseFixtures({mask: /\.js|\.less|\.css/}).then(styleGuide => {
            this.styleGuide = styleGuide;
          });
        });

        it('should find file includes/buttons.js', function(done) {
          expect(this.styleGuide).to.containFixture('includes/buttons.js');
          done();
        });
        it('should find file includes/buttons.less', function(done) {
          expect(this.styleGuide).to.containFixture('includes/buttons.less');
          done();
        });
        it('should find file style.css', function(done) {
          expect(this.styleGuide).to.containFixture('file-type.css');
          done();
        });
      });

      describe("'*.js|*.less|*.css' (string)", function() {
        before(function() {
          return helperUtils.traverseFixtures({mask: '*.js|*.less|*.css'}).then(styleGuide => {
            this.styleGuide = styleGuide;
          });
        });

        it('should find file includes/buttons.js', function(done) {
          expect(this.styleGuide).to.containFixture('includes/buttons.js');
          done();
        });
        it('should find file includes/buttons.less', function(done) {
          expect(this.styleGuide).to.containFixture('includes/buttons.less');
          done();
        });
        it('should find file style.css', function(done) {
          expect(this.styleGuide).to.containFixture('file-type.css');
          done();
        });
      });
    });
  });
});
